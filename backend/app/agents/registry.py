"""Dynamic Agent Registry for Plug-and-Play Voice Agents.

Allows adding as many agents as needed without altering server or transport code.
"""

import importlib
import pkgutil
from typing import Dict, List, Optional, Type
from loguru import logger

from app.agents.base import BaseVoiceAgent


class AgentRegistry:
    """Central registry mapping agent_id -> BaseVoiceAgent instance."""

    def __init__(self):
        self._agents: Dict[str, BaseVoiceAgent] = {}

    def register(self, agent: BaseVoiceAgent) -> BaseVoiceAgent:
        """Register a BaseVoiceAgent instance."""
        if not isinstance(agent, BaseVoiceAgent):
            raise TypeError(f"Expected BaseVoiceAgent, got {type(agent)}")
        self._agents[agent.agent_id] = agent
        logger.info(f"Registered agent: '{agent.agent_id}' ({agent.name})")
        return agent

    def get(self, agent_id: str) -> Optional[BaseVoiceAgent]:
        """Retrieve an agent by agent_id, falling back to 'welcome' default if missing."""
        agent = self._agents.get(agent_id)
        if not agent:
            logger.warning(f"Agent '{agent_id}' not found in registry. Falling back to 'welcome'.")
            agent = self._agents.get("welcome")
        return agent

    def list_agents(self) -> List[Dict]:
        """List metadata for all registered agents."""
        return [agent.to_dict() for agent in self._agents.values()]

    def auto_discover(self, package_path: str = "app.agents.definitions"):
        """Auto-discover and load agent definitions from specified package."""
        try:
            package = importlib.import_module(package_path)
            for _, name, is_pkg in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
                if not is_pkg:
                    importlib.import_module(name)
        except ModuleNotFoundError as e:
            logger.warning(f"Auto-discovery package '{package_path}' not found: {e}")
        except Exception as e:
            logger.error(f"Error auto-discovering agents from '{package_path}': {e}")


# Singleton instance
agent_registry = AgentRegistry()
