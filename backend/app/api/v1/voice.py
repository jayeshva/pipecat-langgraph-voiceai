"""Browser WebRTC & Outbound Voice API Router."""

import asyncio
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel, Field
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client as TwilioClient

from app.core.config import settings
from app.core.memory import CallerMemory
from app.transports import twilio_outbound
from app.transports.livekit import mint_token, spawn_livekit_agent
from app.transports.twilio_inbound import caller_memory

router = APIRouter(prefix="/voice", tags=["Voice"])

# Live browser sessions: room -> asyncio.Task, and room -> caller_id so a
# reconnecting caller can supersede their own previous session.
_active_agents: dict = {}
_agent_callers: dict = {}


async def shutdown_active_agents() -> None:
    """Cancel every live session so the process can exit without orphaning
    STT/TTS websockets or LiveKit rooms."""
    tasks = [t for t in _active_agents.values() if not t.done()]
    for task in tasks:
        task.cancel()
    if tasks:
        logger.info(f"Cancelling {len(tasks)} active voice session(s) on shutdown")
        await asyncio.gather(*tasks, return_exceptions=True)
    _active_agents.clear()
    _agent_callers.clear()


class ConnectRequest(BaseModel):
    caller_id: Optional[str] = Field(None, description="Stable id for visitor memory.")
    language: Optional[str] = Field(None, description="BCP-47 language code.")
    agent_id: Optional[str] = Field("welcome", description="Target agent ID to deploy.")


class ConnectResponse(BaseModel):
    url: str
    token: str
    room: str
    caller_id: str
    agent_id: str


class OutboundCallRequest(BaseModel):
    to: str = Field(..., description="Number to dial in E.164 format.")
    purpose: str = Field(..., min_length=10, description="Reason for calling.")
    language: Optional[str] = Field(None, description="BCP-47 code.")
    agent_id: Optional[str] = Field("welcome", description="Agent ID for call.")


class OutboundCallResponse(BaseModel):
    outbound_id: str
    call_sid: str
    to: str
    status: str
    agent_id: str


@router.post("/connect", response_model=ConnectResponse)
async def connect(req: ConnectRequest):
    try:
        settings.require_livekit()
        settings.require_sarvam()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    agent_id = req.agent_id or "welcome"
    caller_id = req.caller_id or f"visitor-{uuid.uuid4().hex[:12]}"
    room = f"intelliform-{uuid.uuid4().hex[:10]}"

    bot_token = mint_token(room, f"agent-{room}", f"IntelliForm Agent ({agent_id})")
    caller_token = mint_token(room, caller_id, "Visitor")

    # Reap finished sessions.
    for name, task in list(_active_agents.items()):
        if task.done():
            _active_agents.pop(name, None)

    # Retire any session still running for this caller. A browser refresh or a
    # second "Connect" click leaves the previous agent alive: it keeps its STT
    # and TTS websockets open, keeps billing, and both agents then answer the
    # same person. Sessions are per-caller, so only one may be live at a time.
    for name, task in list(_active_agents.items()):
        if _agent_callers.get(name) == caller_id and not task.done():
            logger.info(f"Superseding previous session {name} for caller {caller_id}")
            task.cancel()
            _active_agents.pop(name, None)
            _agent_callers.pop(name, None)

    task = spawn_livekit_agent(
        room_name=room,
        bot_token=bot_token,
        caller_id=caller_id,
        language_code=req.language,
        agent_id=agent_id,
    )
    _active_agents[room] = task
    _agent_callers[room] = caller_id
    # Drop the bookkeeping entry when the agent exits on its own.
    task.add_done_callback(
        lambda _t, r=room: (_active_agents.pop(r, None), _agent_callers.pop(r, None))
    )

    return ConnectResponse(
        url=settings.LIVEKIT_URL, token=caller_token, room=room, caller_id=caller_id, agent_id=agent_id
    )


@router.post("/call", response_model=OutboundCallResponse)
async def place_outbound_call(req: OutboundCallRequest):
    try:
        settings.require_twilio()
        settings.require_sarvam()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    if not settings.TWILIO_FROM_NUMBER:
        raise HTTPException(status_code=503, detail="TWILIO_FROM_NUMBER is not set.")
    if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN):
        raise HTTPException(status_code=503, detail="Outbound calling requires Twilio SID & Auth token.")
    if not req.to.startswith("+"):
        raise HTTPException(status_code=400, detail="Phone number 'to' must be E.164 format with '+' prefix.")

    language = req.language or settings.TWILIO_LANGUAGE
    agent_id = req.agent_id or "welcome"
    outbound_id = twilio_outbound.stash(
        to_number=req.to, purpose=req.purpose, language=language, caller_id=req.to, agent_id=agent_id
    )

    base = f"https://{settings.PUBLIC_HOSTNAME}{settings.API_V1_STR}"
    try:
        client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        call = await asyncio.to_thread(
            client.calls.create,
            to=req.to,
            from_=settings.TWILIO_FROM_NUMBER,
            url=f"{base}/twilio/voice?ob={outbound_id}",
            method="POST",
            status_callback=f"{base}/twilio/status?ob={outbound_id}",
            status_callback_event=["initiated", "ringing", "answered", "completed"],
            status_callback_method="POST",
            timeout=settings.TWILIO_OUTBOUND_RING_TIMEOUT,
            **(
                {
                    "machine_detection": "Enable",
                    "async_amd": "true",
                    "async_amd_status_callback": f"{base}/twilio/amd?ob={outbound_id}",
                    "async_amd_status_callback_method": "POST",
                    "machine_detection_timeout": settings.TWILIO_AMD_TIMEOUT,
                }
                if settings.TWILIO_DETECT_VOICEMAIL
                else {}
            ),
        )
    except TwilioRestException as e:
        twilio_outbound.mark(outbound_id, status=f"failed: {e.msg}")
        raise HTTPException(status_code=400, detail=f"Twilio rejected call: {e.msg}")
    except Exception as e:
        twilio_outbound.mark(outbound_id, status=f"failed: {e}")
        raise HTTPException(status_code=502, detail=f"Could not place call: {e}")

    twilio_outbound.mark(outbound_id, call_sid=call.sid, status="dialing")
    return OutboundCallResponse(
        outbound_id=outbound_id, call_sid=call.sid, to=req.to, status="dialing", agent_id=agent_id
    )


@router.get("/calls")
async def list_outbound_calls():
    return {"calls": twilio_outbound.snapshot()}


@router.delete("/memory/{caller_id}")
async def forget_caller(caller_id: str):
    caller_memory.forget(caller_id)
    return {"status": "forgotten", "caller_id": caller_id}
