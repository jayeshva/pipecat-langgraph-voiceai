"""LangChain / LangGraph Weather Voice Agent definition.

Imports @tool decorated functions from app.mcp.tools.agent_specific.weather_tools.
Uses switchable LLM provider factory (Sarvam, OpenAI, Gemini, Bedrock, Azure).
"""

from typing import Dict, List, Optional
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

from app.core.config import settings
from app.agents.base import BaseVoiceAgent
from app.agents.registry import agent_registry
from app.mcp.tools.agent_specific.weather_tools import (
    get_latitude_longitude,
    get_weather,
)
from app.services.llm_factory import get_langchain_llm


def _build_langchain_weather_app():
    """Build compiled LangChain ReAct StateGraph runnable for the Weather Agent with MemorySaver checkpointer."""
    llm = get_langchain_llm(temperature=0.3)
    tools = [get_latitude_longitude, get_weather]
    checkpointer = MemorySaver()

    system_prompt = (
        "You are a warm, friendly, natural human voice AI assistant.\n"
        "Human Voice Persona Guidelines:\n"
        "1. Speak naturally like a real person talking on a phone call. Avoid robotic data readouts, formal symbols (°), or dry unit names like 'Celsius'.\n"
        "2. Express numbers naturally as spoken words (e.g. say 'about twenty-nine degrees' instead of '29°C').\n"
        "3. Match the user's language and conversational tone smoothly (English, Tanglish, or Hindi).\n"
        "4. Keep spoken responses concise (1-2 short, warm sentences) for natural voice delivery.\n\n"
        "Guidance:\n"
        "- Check the conversation history first! If the weather details or coordinates for the requested city were already fetched in a previous turn during this call, answer directly using the previous tool results from the conversation history WITHOUT calling the tools again.\n"
        "- Only if the user asks for a NEW city or location whose weather is not in the conversation history: First call 'get_latitude_longitude' to get coordinates, then call 'get_weather' to fetch live data.\n"
        "- If asked meta questions about your capabilities or tools: Friendly explain your tools ('get_latitude_longitude' and 'get_weather') in 1 short sentence WITHOUT executing any tools."
    )
    return create_react_agent(model=llm, tools=tools, prompt=system_prompt, checkpointer=checkpointer)


class LangChainWeatherAgent(BaseVoiceAgent):
    """LangChain / LangGraph Weather Voice Agent."""

    def __init__(self):
        super().__init__(
            agent_id="weather_agent",
            name="LangChain Weather Voice Agent",
            description="LangChain ReAct Agent with OpenWeatherMap tools for live weather queries.",
            system_prompt="You are a warm, friendly voice weather assistant.",
        )
        self._app = None

    def is_langgraph(self) -> bool:
        return True

    def get_langgraph_app(self):
        if self._app is None:
            self._app = _build_langchain_weather_app()
        return self._app

    def build_messages(
        self,
        caller_id: str,
        prior_history: Optional[List[Dict[str, str]]] = None,
        opening_instruction: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        return [{"role": "system", "content": self.system_prompt}]


# Auto-register into the dynamic multi-agent registry
agent_registry.register(LangChainWeatherAgent())
