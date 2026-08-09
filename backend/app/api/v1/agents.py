"""Agents API Router.

Exposes endpoints to list registered voice agents and inspect agent metadata.
"""

from fastapi import APIRouter, HTTPException
from app.agents.registry import agent_registry

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.get("")
async def list_agents():
    """List all dynamically registered voice agents."""
    return {"agents": agent_registry.list_agents()}


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """Retrieve metadata for a specific voice agent."""
    agent = agent_registry.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found.")
    return agent.to_dict()
