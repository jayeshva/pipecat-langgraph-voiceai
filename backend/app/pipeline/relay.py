"""TranscriptRelay frame processor for streaming end-to-end pipeline events, mirroring speech state, filtering tool XML markup, and handling graceful hangups."""

import re
import time
from typing import Awaitable, Callable
from loguru import logger
from pipecat.frames.frames import (
    BotStartedSpeakingFrame,
    BotStoppedSpeakingFrame,
    EndFrame,
    Frame,
    FunctionCallInProgressFrame,
    FunctionCallResultFrame,
    InterimTranscriptionFrame,
    LLMFullResponseEndFrame,
    LLMTextFrame,
    TranscriptionFrame,
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from app.core.config import settings

Publisher = Callable[[dict], Awaitable[None]]

TOOL_CALL_BLOCK_REGEX = re.compile(r"<tool_call>.*?</tool_call>", re.DOTALL | re.IGNORECASE)
XML_TAG_REGEX = re.compile(r"<[^>]+>")


class TranscriptRelay(FrameProcessor):
    """Streams end-to-end pipeline activity events, filters LLM tool call XML markup, and triggers graceful EndFrame on hangup."""

    def __init__(self, publish: Publisher):
        super().__init__()
        self._publish = publish
        self._assistant_buffer = ""
        self._pending_hangup = False

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame):
            text = frame.text.strip()
            if text:
                await self._publish({"type": "user.transcript", "text": text})
                await self._publish({
                    "type": "pipeline.event",
                    "category": "stt",
                    "eventType": "stt.transcription",
                    "title": "Speech Recognized",
                    "detail": text,
                    "provider": settings.STT_PROVIDER,
                })

        elif isinstance(frame, InterimTranscriptionFrame):
            await self._publish({"type": "user.interim", "text": frame.text})

        elif isinstance(frame, LLMTextFrame):
            raw_text = frame.text or ""
            
            # Filter tool call XML markup
            if "tool_call" in raw_text.lower() or "arg_value" in raw_text.lower() or "end_call" in raw_text.lower() or "hangup" in raw_text.lower():
                logger.info(f"Detected LLM tool call markup in stream: {raw_text!r}")
                if any(w in raw_text.lower() for w in ["end_call", "hangup_call", "hangup"]):
                    self._pending_hangup = True
                    logger.info("Queued graceful hangup from text tool call.")
                
                cleaned_text = TOOL_CALL_BLOCK_REGEX.sub("", raw_text)
                cleaned_text = XML_TAG_REGEX.sub("", cleaned_text).strip()
                
                if not cleaned_text:
                    return
                frame.text = cleaned_text

            self._assistant_buffer += frame.text

        elif isinstance(frame, LLMFullResponseEndFrame):
            text = self._assistant_buffer.strip()
            self._assistant_buffer = ""
            if text:
                await self._publish({"type": "agent.transcript", "text": text})
                await self._publish({
                    "type": "pipeline.event",
                    "category": "tts",
                    "eventType": "tts.synthesis",
                    "title": "TTS Speech Synthesized",
                    "detail": text,
                    "provider": settings.TTS_PROVIDER,
                })
            if self._pending_hangup and not text:
                logger.info("No farewell speech generated. Disconnecting call immediately.")
                await self.push_frame(EndFrame(), FrameDirection.DOWNSTREAM)
                return

        elif isinstance(frame, (FunctionCallInProgressFrame, FunctionCallResultFrame)):
            tool_name = getattr(frame, "function_name", "") or getattr(frame, "tool_name", "") or getattr(frame, "name", "")
            tool_args = getattr(frame, "arguments", {}) or {}
            if tool_name:
                await self._publish({
                    "type": "tool.execution",
                    "toolName": tool_name,
                    "toolArgs": tool_args,
                    "category": "mcp",
                    "eventType": "mcp.tool",
                    "title": f"Tool '{tool_name}' Executed",
                })
            if tool_name in ("hangup_call", "end_call"):
                logger.info("Native hangup_call tool frame detected — queuing graceful disconnect.")
                self._pending_hangup = True

        elif isinstance(frame, UserStartedSpeakingFrame):
            await self._publish({"type": "state", "state": "user_speaking"})
            await self._publish({
                "type": "pipeline.event",
                "category": "pipeline",
                "eventType": "state.change",
                "title": "State: USER SPEAKING",
                "detail": "Listening for user speech audio frames...",
            })

        elif isinstance(frame, UserStoppedSpeakingFrame):
            await self._publish({"type": "state", "state": "processing"})
            await self._publish({
                "type": "pipeline.event",
                "category": "llm",
                "eventType": "llm.thinking",
                "title": "LLM Inference Triggered",
                "detail": f"Model: {settings.SARVAM_LLM_MODEL} (Provider: {settings.LLM_PROVIDER.upper()})",
            })

        elif isinstance(frame, BotStartedSpeakingFrame):
            await self._publish({"type": "state", "state": "agent_speaking"})
            await self._publish({
                "type": "pipeline.event",
                "category": "pipeline",
                "eventType": "state.change",
                "title": "State: AGENT SPEAKING",
                "detail": "Streaming audio frames to output transport...",
            })

        elif isinstance(frame, BotStoppedSpeakingFrame):
            await self._publish({"type": "state", "state": "listening"})
            await self._publish({
                "type": "pipeline.event",
                "category": "pipeline",
                "eventType": "state.change",
                "title": "State: LISTENING",
                "detail": "Agent listening for user input...",
            })
            if self._pending_hangup:
                logger.info("Farewell speech finished. Pushing EndFrame to disconnect call.")
                self._pending_hangup = False
                await self.push_frame(EndFrame(), FrameDirection.DOWNSTREAM)
                return

        await self.push_frame(frame, direction)
