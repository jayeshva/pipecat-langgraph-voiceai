"""LiveKit WebRTC Browser Transport runner and token generator."""

import asyncio
import json
from typing import Optional, Tuple
from loguru import logger
from livekit import api

from pipecat.frames.frames import EndFrame, LLMRunFrame
from pipecat.pipeline.runner import PipelineRunner
from pipecat.transcriptions.language import Language
from pipecat.transports.livekit.transport import LiveKitParams, LiveKitTransport

from app.core.config import settings
from app.core.memory import CallerMemory
from app.pipeline.builder import SAMPLE_RATE, build_pipeline, caller_memory

JOIN_TIMEOUT_SECONDS = 45

LANGUAGE_MAP = {
    "en-IN": Language.EN_IN,
    "hi-IN": Language.HI_IN,
    "ta-IN": Language.TA_IN,
    "te-IN": Language.TE_IN,
    "kn-IN": Language.KN_IN,
    "ml-IN": Language.ML_IN,
    "mr-IN": Language.MR_IN,
    "bn-IN": Language.BN_IN,
    "gu-IN": Language.GU_IN,
    "pa-IN": Language.PA_IN,
    "or-IN": Language.OR_IN,
}


def resolve_language(code: Optional[str]) -> Language:
    return LANGUAGE_MAP.get(code or settings.DEFAULT_LANGUAGE, Language.EN_IN)


def mint_token(room: str, identity: str, name: str) -> str:
    return (
        api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        .with_identity(identity)
        .with_name(name)
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
        )
        .to_jwt()
    )


async def run_livekit_session(
    room_name: str,
    bot_token: str,
    caller_id: str,
    language_code: Optional[str] = None,
    agent_id: Optional[str] = "welcome",
) -> None:
    settings.require_sarvam()
    settings.require_livekit()

    language = resolve_language(language_code)
    logger.info(f"[{room_name}] Starting WebRTC agent '{agent_id}' (caller={caller_id}, lang={language})")

    transport = LiveKitTransport(
        url=settings.LIVEKIT_URL,
        token=bot_token,
        room_name=room_name,
        params=LiveKitParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            audio_in_sample_rate=SAMPLE_RATE,
            audio_out_sample_rate=SAMPLE_RATE,
        ),
    )

    async def publish(payload: dict) -> None:
        try:
            await transport.send_message(json.dumps(payload))
        except Exception as e:
            logger.debug(f"[{room_name}] Could not publish {payload.get('type')}: {e}")

    task, context, returning_caller = await build_pipeline(
        transport, caller_id, language, publish, room_name, agent_id=agent_id
    )

    caller_joined = asyncio.Event()

    @transport.event_handler("on_first_participant_joined")
    async def _on_join(_transport, participant):
        logger.info(f"[{room_name}] Caller joined: {participant}")
        caller_joined.set()
        await publish({"type": "agent.ready", "returning_caller": returning_caller})
        await task.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_participant_left")
    async def _on_leave(_transport, participant, reason):
        logger.info(f"[{room_name}] Caller left ({reason}) — ending call")
        await task.queue_frames([EndFrame()])

    @transport.event_handler("on_data_received")
    async def _on_data(_transport, data, participant_id):
        try:
            msg = json.loads(data.decode() if isinstance(data, bytes) else data)
        except (json.JSONDecodeError, AttributeError, UnicodeDecodeError):
            return

        if msg.get("type") != "user.text":
            return
        text = (msg.get("text") or "").strip()
        if not text:
            return

        logger.info(f"[{room_name}] Typed turn: {text}")
        await publish({"type": "user.transcript", "text": text})
        context.add_message({"role": "user", "content": text})
        await task.queue_frames([LLMRunFrame()])

    async def _join_watchdog() -> None:
        try:
            await asyncio.wait_for(caller_joined.wait(), timeout=JOIN_TIMEOUT_SECONDS)
        except asyncio.TimeoutError:
            logger.warning(f"[{room_name}] No caller joined within {JOIN_TIMEOUT_SECONDS}s — shutting down")
            await task.queue_frames([EndFrame()])
            await asyncio.sleep(5)
            await task.cancel()

    runner = PipelineRunner(handle_sigint=False)
    watchdog = asyncio.create_task(_join_watchdog())

    try:
        await runner.run(task)
    finally:
        watchdog.cancel()
        try:
            caller_memory.remember(caller_id, context.get_messages())
        except Exception as e:
            logger.warning(f"[{room_name}] Memory save error: {e}")


def spawn_livekit_agent(
    room_name: str,
    bot_token: str,
    caller_id: str,
    language_code: Optional[str] = None,
    agent_id: Optional[str] = "welcome",
) -> asyncio.Task:
    async def _guarded() -> None:
        try:
            await run_livekit_session(room_name, bot_token, caller_id, language_code, agent_id=agent_id)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.exception(f"[{room_name}] Agent '{agent_id}' crashed: {e}")

    return asyncio.create_task(_guarded(), name=f"agent:{agent_id}:{room_name}")
