"""Pipecat Audio Pipeline Builder.

Assembles STT, Silero VAD, Agent Brain (Pipecat LLM / LangGraph / MCP), Transcript Relay, and TTS using switchable provider factories and native user mute strategies.
"""

from pathlib import Path
from typing import Any, Awaitable, Callable, Optional, Tuple
from loguru import logger

from pipecat.audio.turn.smart_turn.base_smart_turn import SmartTurnParams
from pipecat.audio.turn.smart_turn.local_smart_turn_v3 import LocalSmartTurnAnalyzerV3
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.turns.user_turn_strategies import (
    UserTurnStrategies,
    default_user_turn_start_strategies,
)
from pipecat.turns.user_stop.turn_analyzer_user_turn_stop_strategy import (
    TurnAnalyzerUserTurnStopStrategy,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.turns.user_mute.always_user_mute_strategy import AlwaysUserMuteStrategy
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


def build_turn_strategies() -> UserTurnStrategies:
    """Turn detection with a configurable mid-sentence wait.

    Three layers decide when the caller has finished speaking:

      1. Silero VAD  — raw speech/silence only. `VAD_STOP_SECS` (0.2s) says
         "audio stopped", never "the turn ended".
      2. Smart turn  — a local model that judges whether what was said is
         *semantically* finished. "Hello" is complete; "my name is" is not.
      3. `TURN_WAIT_SECS` — how long an utterance judged incomplete may stay
         open waiting for the caller to continue.

    Pipecat's default for step 3 is 3s and is not otherwise reachable from
    config, which matters because the right value is workload-specific: a
    caller reciting a phone number pauses far longer than one answering a
    yes/no question.
    """
    analyzer = LocalSmartTurnAnalyzerV3(
        params=SmartTurnParams(stop_secs=settings.TURN_WAIT_SECS)
    )
    return UserTurnStrategies(
        start=default_user_turn_start_strategies(),
        stop=[TurnAnalyzerUserTurnStopStrategy(turn_analyzer=analyzer)],
    )


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

    # Echo control. "always" trades barge-in away for guaranteed isolation on
    # open speakers; the default keeps interruption working and leans on WebRTC
    # echo cancellation, which is how production voice agents behave.
    if settings.ECHO_SUPPRESSION.lower().strip() == "always":
        user_mute_strategy = AlwaysUserMuteStrategy()
        logger.info(f"[{label}] Echo suppression: ALWAYS (barge-in disabled)")
    else:
        user_mute_strategy = MuteUntilFirstBotCompleteUserMuteStrategy()

    if target_agent.is_langgraph():
        langgraph_app = target_agent.get_langgraph_app()
        processor_node = LangGraphVoiceAdapter(
            langgraph_app,
            caller_id,
            target_agent.system_prompt,
            publish=publish,
            greeting_instruction=opening_instruction,
        )

        messages = [{"role": "system", "content": target_agent.system_prompt}]
        context = LLMContext(messages)
        user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
            context,
            user_params=LLMUserAggregatorParams(
                vad_analyzer=SileroVADAnalyzer(sample_rate=SAMPLE_RATE, params=vad_params),
                user_mute_strategies=[user_mute_strategy],
                user_turn_strategies=build_turn_strategies(),
            ),
        )

        # The adapter occupies the LLM slot — downstream of the user aggregator,
        # exactly where `llm` sits in the Pipecat branch below. Placing it before
        # the aggregator would bypass the mute strategy and let the agent hear
        # and transcribe its own TTS output as user speech.
        pipeline = Pipeline(
            [
                transport.input(),
                stt,
                user_aggregator,
                processor_node,
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
                user_turn_strategies=build_turn_strategies(),
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
