"""LangGraph Real-Time Voice Adapter.

Bridges a LangGraph StateGraph into the Pipecat audio pipeline by behaving like
an ordinary Pipecat LLM service: it sits **downstream of the user aggregator**,
consumes ``LLMContextFrame``, and emits the standard response frame contract.

Why that position matters
-------------------------
Pipecat's ``LLMUserAggregator`` already owns turn-taking: it buffers partial
transcripts, applies mute strategies, runs smart end-of-turn analysis, and emits
one ``LLMContextFrame`` per completed turn. An adapter placed *upstream* of it
sees raw ``TranscriptionFrame``s instead, which means it re-implements that
logic badly and — critically — bypasses the mute strategy, so the agent
transcribes its own TTS output as user speech.

Frame contract emitted per turn (what the assistant aggregator expects):

    LLMFullResponseStartFrame  -> flushes the user message into the context
    LLMTextFrame ...           -> streamed response tokens, fed to TTS
    LLMFullResponseEndFrame    -> closes the assistant turn

Omitting the start frame silently drops every user message from the saved
transcript, so caller memory persists a one-sided conversation.
"""

import asyncio
from typing import Any, Awaitable, Callable, List, Optional

from langchain_core.messages import HumanMessage
from loguru import logger
from pipecat.frames.frames import (
    CancelFrame,
    EndFrame,
    Frame,
    InterruptionFrame,
    LLMContextFrame,
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    LLMTextFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from app.core.config import settings

Publisher = Callable[[dict], Awaitable[None]]

# A completed "turn" shorter than this is almost always a cough, a filler like
# "uh", or residual echo rather than a real request. Running a graph turn on it
# wastes an LLM call and makes the agent talk over itself.
MIN_MEANINGFUL_TURN_CHARS = 2


class LangGraphVoiceAdapter(FrameProcessor):
    """Runs LangGraph turns in the LLM slot of a Pipecat pipeline."""

    def __init__(
        self,
        langgraph_app: Any,
        caller_id: str,
        system_prompt: Optional[str] = None,
        publish: Optional[Publisher] = None,
        greeting_instruction: Optional[str] = None,
    ):
        super().__init__()
        self._app = langgraph_app
        self._caller_id = caller_id
        self._system_prompt = system_prompt
        self._publish = publish
        self._greeting_instruction = greeting_instruction
        self._config = {"configurable": {"thread_id": caller_id}}
        self._turn_task: Optional[asyncio.Task] = None
        self._greeted = False

    # ------------------------------------------------------------------ frames

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, LLMContextFrame):
            # Never block the processor here. If the graph turn were awaited
            # inline, an InterruptionFrame arriving mid-turn would queue behind
            # it and barge-in would not take effect until the agent had already
            # finished speaking.
            await self.push_frame(frame, direction)
            await self._start_turn(frame.context)
            return

        if isinstance(frame, (InterruptionFrame, CancelFrame, EndFrame)):
            await self._cancel_turn()

        await self.push_frame(frame, direction)

    # -------------------------------------------------------------- turn logic

    def _latest_user_text(self, context: Any) -> str:
        """Pull the newest user message out of the aggregated context."""
        try:
            messages = context.get_messages() or []
        except Exception:
            return ""

        for msg in reversed(messages):
            role = msg.get("role") if isinstance(msg, dict) else getattr(msg, "role", None)
            if role != "user":
                continue
            content = msg.get("content") if isinstance(msg, dict) else getattr(msg, "content", "")
            if isinstance(content, list):
                # Multimodal content blocks — keep only the text parts.
                content = " ".join(
                    part.get("text", "") for part in content if isinstance(part, dict)
                )
            return (content or "").strip()
        return ""

    async def _start_turn(self, context: Any) -> None:
        user_text = self._latest_user_text(context)

        if not user_text:
            # No user message yet: this is the opening turn triggered when the
            # caller joins. Speak the greeting instead of inventing a fake user
            # message — injecting one would persist into the LangGraph
            # checkpointer and corrupt this caller's history forever.
            if self._greeted:
                return
            self._greeted = True
            user_text = self._greeting_instruction or "Greet the caller warmly and ask how you can help."
            logger.info(f"[LangGraph:{self._caller_id}] Opening greeting turn")
        else:
            self._greeted = True
            if len(user_text) < MIN_MEANINGFUL_TURN_CHARS:
                logger.debug(f"[LangGraph:{self._caller_id}] Ignoring noise-only turn: {user_text!r}")
                return
            logger.info(f"[LangGraph:{self._caller_id}] Turn: {user_text!r}")

        await self._cancel_turn()
        self._turn_task = self.create_task(
            self._run_graph_turn(user_text), name=f"langgraph-turn:{self._caller_id}"
        )

    async def _cancel_turn(self) -> None:
        """Abandon an in-flight graph turn (barge-in, hangup, shutdown)."""
        task = self._turn_task
        self._turn_task = None
        if task and not task.done():
            await self.cancel_task(task)

    async def _run_graph_turn(self, user_text: str) -> None:
        """Execute one StateGraph turn, streaming tokens to TTS as they arrive."""
        inputs = {"messages": [HumanMessage(content=user_text)]}
        chunks: List[str] = []
        started = False

        try:
            if hasattr(self._app, "astream_events"):
                async for event in self._app.astream_events(inputs, config=self._config, version="v2"):
                    kind = event.get("event")

                    if kind == "on_chat_model_start":
                        logger.info(f"🧠 [LangGraph:{self._caller_id}] Chat model turn started")
                        await self._emit_event(
                            {
                                "type": "pipeline.event",
                                "category": "llm",
                                "eventType": "llm.thinking",
                                "title": "LangGraph Reasoning Node",
                                "detail": f"StateGraph thread: {self._caller_id}",
                                "provider": settings.LLM_PROVIDER,
                            }
                        )

                    elif kind == "on_tool_start":
                        tool_name = event.get("name", "tool")
                        tool_args = event.get("data", {}).get("input", {})
                        logger.info(f"🛠️ [LangGraph:{self._caller_id}] MCP tool '{tool_name}' args={tool_args}")
                        await self._emit_event(
                            {
                                "type": "tool.execution",
                                "toolName": tool_name,
                                "toolArgs": tool_args,
                                "category": "mcp",
                                "eventType": "mcp.tool",
                                "title": f"Tool '{tool_name}' Executed",
                            }
                        )

                    elif kind == "on_chat_model_stream":
                        chunk = event.get("data", {}).get("chunk")
                        content = getattr(chunk, "content", "") if chunk else ""
                        if content:
                            if not started:
                                started = True
                                await self.push_frame(
                                    LLMFullResponseStartFrame(), FrameDirection.DOWNSTREAM
                                )
                            chunks.append(content)
                            await self.push_frame(
                                LLMTextFrame(text=content), FrameDirection.DOWNSTREAM
                            )

            if not chunks:
                # Graph exposed no token stream (or produced nothing) — fall back
                # to a single invocation and speak the final message.
                res = await self._app.ainvoke(inputs, config=self._config)
                messages = res.get("messages", [])
                if messages:
                    content = getattr(messages[-1], "content", "") or str(messages[-1])
                    if isinstance(content, list):
                        content = "".join(
                            c.get("text", "") if isinstance(c, dict) else str(c) for c in content
                        )
                    content = str(content).strip()
                    if content:
                        started = True
                        await self.push_frame(
                            LLMFullResponseStartFrame(), FrameDirection.DOWNSTREAM
                        )
                        chunks.append(content)
                        await self.push_frame(
                            LLMTextFrame(text=content), FrameDirection.DOWNSTREAM
                        )

            logger.info(f"[LangGraph:{self._caller_id}] Response: {''.join(chunks)!r}")

        except asyncio.CancelledError:
            # Barge-in. The caller is already talking, so stay silent and let the
            # next turn take over — but still close the frame pair below.
            logger.info(f"[LangGraph:{self._caller_id}] Turn cancelled (barge-in)")
            raise
        except Exception as e:
            logger.exception(f"[LangGraph:{self._caller_id}] Turn failed: {e}")
            if not started:
                started = True
                await self.push_frame(LLMFullResponseStartFrame(), FrameDirection.DOWNSTREAM)
            await self.push_frame(
                LLMTextFrame(text="Sorry, I ran into a problem handling that. Could you say it again?"),
                FrameDirection.DOWNSTREAM,
            )
        finally:
            # Close the response only if one was opened, so the assistant
            # aggregator never sees an unmatched end frame.
            if started:
                await self.push_frame(LLMFullResponseEndFrame(), FrameDirection.DOWNSTREAM)

    async def _emit_event(self, payload: dict) -> None:
        if not self._publish:
            return
        try:
            await self._publish(payload)
        except Exception as e:  # telemetry must never break a call
            logger.debug(f"[LangGraph:{self._caller_id}] Event publish failed: {e}")
