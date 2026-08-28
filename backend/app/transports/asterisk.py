"""Asterisk SIP & AudioSocket Media Streams Handler.

Bridges Asterisk PBX PJSIP channels & AudioSocket media streams into Pipecat real-time audio pipeline.
"""

from typing import Optional
from fastapi import WebSocket
from loguru import logger

from pipecat.frames.frames import EndFrame, LLMRunFrame
from pipecat.pipeline.runner import PipelineRunner
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)

from app.core.config import settings
from app.pipeline.builder import SAMPLE_RATE, build_pipeline, caller_memory
from app.transports.livekit import resolve_language


async def run_asterisk_media_stream(
    websocket: WebSocket,
    call_id: str,
    caller_id: str,
    language_code: Optional[str] = None,
    opening_instruction: Optional[str] = None,
    agent_id: Optional[str] = "welcome",
) -> None:
    """Handle an inbound Asterisk SIP / AudioSocket media stream session over WebSocket."""
    language = resolve_language(language_code)
    label = f"asterisk:{call_id[-8:]}"
    logger.info(f"[{label}] Asterisk SIP Call from '{caller_id}' for agent '{agent_id}' (lang={language})")

    transport = FastAPIWebsocketTransport(
        websocket=websocket,
        params=FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            audio_in_sample_rate=SAMPLE_RATE,
            audio_out_sample_rate=SAMPLE_RATE,
            add_wav_header=False,
            session_timeout=settings.TWILIO_SESSION_TIMEOUT_SECONDS,
        ),
    )

    async def publish(payload: dict) -> None:
        kind = payload.get("type")
        if kind == "user.transcript":
            logger.info(f"[{label}] caller: {payload.get('text')}")
        elif kind == "agent.transcript":
            logger.info(f"[{label}] agent : {payload.get('text')}")

    task, context, _returning = await build_pipeline(
        transport, caller_id, language, publish, label, opening_instruction, agent_id=agent_id
    )

    @transport.event_handler("on_client_connected")
    async def _on_connected(_transport, _client):
        logger.info(f"[{label}] Asterisk media stream connected — greeting SIP caller")
        await task.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def _on_disconnected(_transport, _client):
        logger.info(f"[{label}] Asterisk SIP Caller hung up")
        await task.queue_frames([EndFrame()])

    @transport.event_handler("on_session_timeout")
    async def _on_timeout(_transport, _client):
        logger.warning(f"[{label}] Asterisk session timed out — ending call")
        await task.queue_frames([EndFrame()])

    runner = PipelineRunner(handle_sigint=False)

    try:
        await runner.run(task)
    finally:
        try:
            caller_memory.remember(caller_id, context.get_messages())
        except Exception as e:
            logger.warning(f"[{label}] Memory save error: {e}")
