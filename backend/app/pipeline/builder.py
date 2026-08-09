"""Pipecat Audio Pipeline Builder.

Assembles STT, Silero VAD, Agent Brain (Pipecat LLM / LangGraph / MCP), Transcript Relay, and TTS using switchable provider factories and native user mute strategies.
"""

from pathlib import Path
from typing import Any, Awaitable, Callable, Optional, Tuple
from loguru import logger

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.turns.user_mute.mute_until_first_bot_complete_user_mute_strategy import (
    MuteUntilFirstBotCompleteUserMuteStrategy,
)
from pipecat.transcriptions.language import Language

from app.core.config import settings
from app.core.memory import CallerMemory
from app.agents.registry import agent_registry
from app.langgraph.adapter import LangGraphVoiceAdapter
from app.pipeline.relay import TranscriptRelay
from app.services.llm_factory import get_pipecat_llm
from app.services.stt_factory import get_stt_service
from app.services.tts_factory import get_tts_service

SAMPLE_RATE = 16000

caller_memory = CallerMemory(
    path=Path(__file__).resolve().parent.parent.parent / "data" / "caller_memory.json",
    ttl_seconds=settings.MEMORY_TTL_SECONDS,
)

Publisher = Callable[[dict], Awaitable[None]]


async def build_pipeline(
    transport: Any,
    caller_id: str,
    language: Language,
    publish: Publisher,
    label: str,
    opening_instruction: Optional[str] = None,
    agent_id: Optional[str] = "welcome",
) -> Tuple[PipelineTask, LLMContext, bool]:
    """Assemble the unified Pipecat real-time audio pipeline using switchable STT/TTS/LLM providers and MuteUntilFirstBotCompleteUserMuteStrategy."""
    target_agent = agent_registry.get(agent_id or "welcome")
    logger.info(
        f"[{label}] Building pipeline for agent '{target_agent.agent_id}' ({target_agent.name}) "
        f"[Providers: LLM={settings.LLM_PROVIDER}, STT={settings.STT_PROVIDER}, TTS={settings.TTS_PROVIDER}]"
    )

    stt = get_stt_service(language=language, sample_rate=SAMPLE_RATE)
    tts = get_tts_service(language=language, sample_rate=SAMPLE_RATE)

    prior = caller_memory.recall(caller_id)
    returning_caller = bool(prior)

    vad_params = VADParams(
        confidence=settings.VAD_CONFIDENCE,
        min_volume=settings.VAD_MIN_VOLUME,
        start_secs=settings.VAD_START_SECS,
        stop_secs=settings.VAD_STOP_SECS,
    )

    user_mute_strategy = MuteUntilFirstBotCompleteUserMuteStrategy()

    if target_agent.is_langgraph():
        langgraph_app = target_agent.get_langgraph_app()
        processor_node = LangGraphVoiceAdapter(langgraph_app, caller_id, target_agent.system_prompt, publish=publish)

        messages = [{"role": "system", "content": target_agent.system_prompt}]
        context = LLMContext(messages)
        user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
            context,
            user_params=LLMUserAggregatorParams(
                vad_analyzer=SileroVADAnalyzer(sample_rate=SAMPLE_RATE, params=vad_params),
                user_mute_strategies=[user_mute_strategy],
            ),
        )

        pipeline = Pipeline(
            [
                transport.input(),
                stt,
                processor_node,
                user_aggregator,
                TranscriptRelay(publish),
                tts,
                transport.output(),
                assistant_aggregator,
            ]
        )
    else:
        messages = target_agent.build_messages(caller_id, prior, opening_instruction)
        context = LLMContext(messages)

        llm = get_pipecat_llm()

        mcp_tools = await target_agent.get_tools()
        if mcp_tools:
            logger.info(f"[{label}] Binding {len(mcp_tools)} MCP tools to LLM for agent '{target_agent.agent_id}'")

        user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
            context,
            user_params=LLMUserAggregatorParams(
                vad_analyzer=SileroVADAnalyzer(sample_rate=SAMPLE_RATE, params=vad_params),
                user_mute_strategies=[user_mute_strategy],
            ),
        )

        pipeline = Pipeline(
            [
                transport.input(),
                stt,
                user_aggregator,
                llm,
                TranscriptRelay(publish),
                tts,
                transport.output(),
                assistant_aggregator,
            ]
        )

    task = PipelineTask(pipeline, enable_rtvi=False)
    return task, context, returning_caller
