"""FastAPI Application Entrypoint for IntelliForm AI Voice Backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.agents.registry import agent_registry
from app.mcp.manager import mcp_manager
from app.api.v1.router import api_v1_router

# Trigger startup auto-discovery for MCP Tools & Dynamic Agents
mcp_manager.auto_discover_tools()
agent_registry.auto_discover()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Universal Voice AI Backend with Multi-Agent Registry, LangGraph, and MCP support.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.on_event("shutdown")
async def _shutdown():
    # Reload in development restarts the process on every edit. Without this,
    # each restart orphans any live agent — its STT/TTS websockets stay open and
    # keep logging, which is what makes several agents appear to run at once.
    from app.api.v1.voice import shutdown_active_agents

    await shutdown_active_agents()
    logger.info("Server shutting down.")
