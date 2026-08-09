"""Default IntelliForm Welcome Agent definition."""

from typing import Dict, List, Optional
from app.agents.base import BaseVoiceAgent
from app.agents.registry import agent_registry
from app.core.prompts import GREETING_INSTRUCTION, WELCOME_AGENT_SYSTEM_PROMPT


class WelcomeAgent(BaseVoiceAgent):
    def __init__(self):
        super().__init__(
            agent_id="welcome",
            name="IntelliForm Welcome Agent",
            description="Default welcome agent that greets visitors and helps with inquiries.",
            system_prompt=WELCOME_AGENT_SYSTEM_PROMPT,
        )

    def build_messages(
        self, caller_id: str, prior_history: Optional[List[Dict[str, str]]] = None, opening_instruction: Optional[str] = None
    ) -> List[Dict[str, str]]:
        messages = [{"role": "system", "content": self.system_prompt}]

        returning_caller = bool(prior_history)
        if returning_caller and prior_history:
            messages.extend(prior_history)

        if opening_instruction:
            if returning_caller:
                messages.append(
                    {
                        "role": "system",
                        "content": (
                            "The messages above are an earlier conversation with this same person. "
                            "Do not re-introduce the platform from scratch."
                        ),
                    }
                )
            messages.append({"role": "system", "content": opening_instruction})
        elif returning_caller:
            messages.append(
                {
                    "role": "system",
                    "content": (
                        "This person has spoken with you before. Greet them as a returning visitor in one short sentence."
                    ),
                }
            )
        else:
            messages.append({"role": "system", "content": GREETING_INSTRUCTION})

        return messages


# Auto-register the welcome agent
agent_registry.register(WelcomeAgent())
