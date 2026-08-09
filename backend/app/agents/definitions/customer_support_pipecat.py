"""Customer Support Pipecat Agent definition with Scoped MCP Tools."""

from typing import Dict, List, Optional
from app.agents.base import BaseVoiceAgent
from app.agents.registry import agent_registry

SYSTEM_PROMPT = (
    "You are the IntelliForm AI Customer Support Representative. You assist users with account inquiries, "
    "ticket creation, and general service help. Speak concisely in one or two short sentences."
)


class CustomerSupportPipecatAgent(BaseVoiceAgent):
    def __init__(self):
        super().__init__(
            agent_id="customer_support",
            name="IntelliForm Customer Support Agent",
            description="Pipecat LLM voice agent equipped with support ticket and account lookup MCP tools.",
            system_prompt=SYSTEM_PROMPT,
        )

    def build_messages(
        self, caller_id: str, prior_history: Optional[List[Dict[str, str]]] = None, opening_instruction: Optional[str] = None
    ) -> List[Dict[str, str]]:
        messages = [{"role": "system", "content": self.system_prompt}]
        if prior_history:
            messages.extend(prior_history)

        if opening_instruction:
            messages.append({"role": "system", "content": opening_instruction})
        else:
            messages.append(
                {
                    "role": "system",
                    "content": "Greet the customer warmly in one short sentence and ask how customer support can assist them today.",
                }
            )
        return messages


# Auto-register Customer Support agent
agent_registry.register(CustomerSupportPipecatAgent())
