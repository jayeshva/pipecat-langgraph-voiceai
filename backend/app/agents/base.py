"""Base Voice Agent Class.

All agents (standard Pipecat LLM agents, LangGraph state graph agents, or MCP-backed agents)
inherit from BaseVoiceAgent.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from app.core.prompts import VOICE_OUTPUT_STYLE
from app.mcp.manager import mcp_manager


class BaseVoiceAgent(ABC):
    """Abstract base class for all plug-and-play voice agents."""

    def __init__(
        self,
        agent_id: str,
        name: str,
        description: str,
        system_prompt: str = "",
        language: str = "en-IN",
    ):
        self.agent_id = agent_id
        self.name = name
        self.description = description
        # Every agent speaks through TTS, so the voice style rules are not
        # optional per-agent boilerplate — they apply to the channel itself.
        # Appending here means a new agent cannot forget them.
        self.system_prompt = (system_prompt + VOICE_OUTPUT_STYLE) if system_prompt else VOICE_OUTPUT_STYLE
        self.language = language

    @abstractmethod
    def build_messages(
        self, caller_id: str, prior_history: Optional[List[Dict[str, str]]] = None, opening_instruction: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """Construct the prompt messages array for this caller turn."""
        pass

    async def get_tools(self) -> List[Dict[str, Any]]:
        """Return combined MCP tools (Common Shared + Agent-Specific) for this agent."""
        return await mcp_manager.get_tools_for_agent(self.agent_id)

    def is_langgraph(self) -> bool:
        """Returns True if this agent's brain is driven by a LangGraph StateGraph."""
        return False

    def get_langgraph_app(self) -> Optional[Any]:
        """Returns the compiled LangGraph StateGraph app if is_langgraph() is True."""
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Metadata representation for API endpoint discovery."""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "description": self.description,
            "language": self.language,
            "is_langgraph": self.is_langgraph(),
        }
