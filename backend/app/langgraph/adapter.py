"""LangGraph Real-Time Voice Adapter.

Bridges LangGraph StateGraph runnables into the Pipecat real-time audio pipeline with full multi-chunk turn aggregation, opening greeting trigger, and live tool & pipeline event stream publishing.
"""

from typing import Any, Awaitable, Callable, Optional, List
from loguru import logger

from langchain_core.messages import HumanMessage
from pipecat.frames.frames import (
    Frame,
    StartFrame,
    LLMFullResponseEndFrame,
    LLMRunFrame,
    LLMTextFrame,
    TranscriptionFrame,
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from app.core.config import settings

Publisher = Callable[[dict], Awaitable[None]]


class LangGraphVoiceAdapter(FrameProcessor):
    """Pipecat FrameProcessor that buffers user speech chunks, triggers opening greeting turn on StartFrame, and executes LangGraph StateGraph turns."""

    def __init__(
        self,
        langgraph_app: Any,
        caller_id: str,
        system_prompt: Optional[str] = None,
        publish: Optional[Publisher] = None,
    ):
        super().__init__()
        self._app = langgraph_app
        self._caller_id = caller_id
        self._system_prompt = system_prompt
        self._publish = publish
        self._config = {"configurable": {"thread_id": caller_id}}
        self._turn_chunks: List[str] = []
        self._started = False

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, StartFrame):
            await self.push_frame(frame, direction)
            if not self._started:
                self._started = True
                logger.info(f"[LangGraph:{self._caller_id}] Initializing opening greeting turn on session start")
                await self._run_graph_turn("Hello")

        elif isinstance(frame, UserStartedSpeakingFrame):
            self._turn_chunks = []
            await self.push_frame(frame, direction)

        elif isinstance(frame, TranscriptionFrame):
            text = frame.text.strip()
            if text:
                if not self._turn_chunks or self._turn_chunks[-1] != text:
                    self._turn_chunks.append(text)
                accumulated = " ".join(self._turn_chunks)
                logger.info(f"[LangGraph:{self._caller_id}] Buffered chunk: {text!r} | Accumulated turn: {accumulated!r}")
            await self.push_frame(frame, direction)

        elif isinstance(frame, (UserStoppedSpeakingFrame, LLMRunFrame)):
            if self._turn_chunks:
                full_turn = " ".join(self._turn_chunks).strip()
                self._turn_chunks = []
                logger.info(f"[LangGraph:{self._caller_id}] Executing LangGraph turn for complete sentence: {full_turn!r}")
                await self._run_graph_turn(full_turn)
            else:
                await self.push_frame(frame, direction)
        else:
            await self.push_frame(frame, direction)

    async def _run_graph_turn(self, user_text: str):
        """Execute one turn of the LangGraph state graph and stream tool execution logs and response tokens to TTS."""
        inputs = {"messages": [HumanMessage(content=user_text)]}
        full_response = ""

        try:
            if hasattr(self._app, "astream_events"):
                async for event in self._app.astream_events(inputs, config=self._config, version="v2"):
                    kind = event.get("event")

                    if kind == "on_chat_model_start":
                        logger.info(f"🧠 [LangGraph:{self._caller_id}] Chat model turn started")
                        if self._publish:
                            await self._publish({
                                "type": "pipeline.event",
                                "category": "llm",
                                "eventType": "llm.thinking",
                                "title": "LangGraph Reasoning Node",
                                "detail": f"StateGraph thread: {self._caller_id}",
                                "provider": settings.LLM_PROVIDER,
                            })

                    elif kind == "on_tool_start":
                        tool_name = event.get("name", "tool")
                        tool_args = event.get("data", {}).get("input", {})
                        logger.info(f"🛠️ [LangGraph:{self._caller_id}] MCP Tool Executed: '{tool_name}' with args: {tool_args}")
                        if self._publish:
                            await self._publish({
                                "type": "tool.execution",
                                "toolName": tool_name,
                                "toolArgs": tool_args,
                                "category": "mcp",
                                "eventType": "mcp.tool",
                                "title": f"Tool '{tool_name}' Executed",
                            })

                    elif kind == "on_chat_model_stream":
                        chunk = event.get("data", {}).get("chunk")
                        content = getattr(chunk, "content", "") if chunk else ""
                        if content:
                            full_response += content
                            await self.push_frame(LLMTextFrame(text=content), FrameDirection.DOWNSTREAM)

            if not full_response:
                res = await self._app.ainvoke(inputs, config=self._config)
                messages = res.get("messages", [])
                if messages:
                    last_msg = messages[-1]
                    content = getattr(last_msg, "content", "") or str(last_msg)
                    if isinstance(content, list):
                        content = "".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content])
                    full_response = str(content)
                    await self.push_frame(LLMTextFrame(text=full_response), FrameDirection.DOWNSTREAM)

            logger.info(f"[LangGraph:{self._caller_id}] Completed turn response: {full_response!r}")
        except Exception as e:
            logger.exception(f"[LangGraph:{self._caller_id}] Error in LangGraph turn: {e}")
            error_msg = "I apologize, but I encountered an issue processing your request."
            await self.push_frame(LLMTextFrame(text=error_msg), FrameDirection.DOWNSTREAM)

        await self.push_frame(LLMFullResponseEndFrame(), FrameDirection.DOWNSTREAM)
