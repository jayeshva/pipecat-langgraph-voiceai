"""LangGraph Form Collector Agent definition.

Uses dynamic form templates (e.g. College Admission, Event Registration, KYC Onboarding)
to collect, validate, and submit dynamic user form responses to MCP tools using LangGraph ReAct StateGraph.
"""

from typing import Dict, List, Optional
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

from app.core.config import settings
from app.core.prompts import VOICE_OUTPUT_STYLE
from app.agents.base import BaseVoiceAgent
from app.agents.registry import agent_registry
from app.mcp.tools.agent_specific.form_collector_tools import (
    get_available_form_templates,
    submit_form_response,
)
from app.services.llm_factory import get_langchain_llm


def _build_langchain_form_collector_app():
    """Build compiled LangGraph ReAct StateGraph runnable for the Form Collector Agent with MemorySaver checkpointer."""
    llm = get_langchain_llm(temperature=0.3)
    tools = [get_available_form_templates, submit_form_response]
    checkpointer = MemorySaver()

    system_prompt = (
        "You are the IntelliForm Dynamic LangGraph Form Collector Agent.\n"
        "Your mission is to help users fill out dynamic forms (e.g. College Admission, Event Registration, KYC Onboarding) conversationally.\n\n"
        "Guidance & Rules:\n"
        "1. DEFAULT TEMPLATE: By default, assume the user is filling out the 'college_admission' (College Admission Form).\n"
        "   The required fields for 'college_admission' are:\n"
        "   - student_name (Student Full Name)\n"
        "   - email (Email Address)\n"
        "   - phone (Phone Number)\n"
        "   - preferred_course (Selectable: 'Computer Science & Engineering', 'AI & Data Science', 'Business Administration (BBA)', 'Mechanical Engineering', 'Electronics & Communication')\n"
        "   - high_school_percentage (Grade 12 Percentage Score)\n\n"
        "2. FIELD EXTRACTION & CONVERSATIONAL PROMPTS:\n"
        "   - Read previous turns in the conversation history carefully. Extract any fields the user has already provided.\n"
        "   - If any required fields are missing, ask for the missing fields politely and concisely (1-2 natural sentences per turn).\n"
        "   - If the user asks what forms are available, call 'get_available_form_templates' to list templates.\n\n"
        "3. AUTOMATED MCP SUBMISSION:\n"
        "   - Once ALL required fields for the form are collected in conversation, IMMEDIATELY call the 'submit_form_response' MCP tool with form_data payload!\n"
        "   - After tool execution, confirm submission warmly to the user with their generated confirmation code."
        # The graph drives the LLM directly, so the voice style rules have to be
        # appended here too — BaseVoiceAgent.system_prompt never reaches it.
        + VOICE_OUTPUT_STYLE
    )
    return create_react_agent(model=llm, tools=tools, prompt=system_prompt, checkpointer=checkpointer)


class LangGraphFormCollectorAgent(BaseVoiceAgent):
    """LangGraph Dynamic Form Collector Voice & Text Agent."""

    def __init__(self):
        super().__init__(
            agent_id="form_collector",
            name="LangGraph Form Collector Agent",
            description="Dynamic template-driven Form Collector Agent using LangGraph ReAct StateGraph and MCP tools.",
            system_prompt="You are a dynamic LangGraph form collector assistant.",
        )
        self._app = None

    def is_langgraph(self) -> bool:
        return True

    def get_langgraph_app(self):
        if self._app is None:
            self._app = _build_langchain_form_collector_app()
        return self._app

    def build_messages(
        self,
        caller_id: str,
        prior_history: Optional[List[Dict[str, str]]] = None,
        opening_instruction: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        return [{"role": "system", "content": self.system_prompt}]


# Auto-register the LangGraph agent
agent_registry.register(LangGraphFormCollectorAgent())
