"""Combined API v1 Router."""

from fastapi import APIRouter

from app.api.v1.agents import router as agents_router
from app.api.v1.chat import router as chat_router
from app.api.v1.health import router as health_router
from app.api.v1.mcp import router as mcp_router
from app.api.v1.twilio import router as twilio_router
from app.api.v1.voice import router as voice_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router)
api_v1_router.include_router(chat_router)
api_v1_router.include_router(voice_router)
api_v1_router.include_router(twilio_router)
api_v1_router.include_router(agents_router)
api_v1_router.include_router(mcp_router)
