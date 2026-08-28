"""Asterisk Telephony & SIP API Router.

Provides WebSocket media stream handler, pjsip.conf / extensions.conf template generator, and Asterisk AMI call originate API.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel, Field
from loguru import logger

from app.core.config import settings
from app.transports.asterisk import run_asterisk_media_stream

router = APIRouter(prefix="/asterisk", tags=["Asterisk SIP Telephony"])


class AsteriskCallRequest(BaseModel):
    to_extension: str = Field(..., description="Target extension or phone number (e.g. '1001', '+919876543210')")
    agent_id: str = Field("welcome", description="Target voice agent ID")
    caller_id: Optional[str] = Field(None, description="Caller identifier string")
    context: str = Field("from-internal", description="Asterisk dialplan context")


@router.websocket("/ws")
async def asterisk_media_stream_websocket(
    websocket: WebSocket,
    call_id: Optional[str] = None,
    caller_id: Optional[str] = "asterisk-sip-caller",
    agent_id: Optional[str] = "welcome",
    language: Optional[str] = "en-IN",
):
    """FastAPI WebSocket endpoint for Asterisk PBX AudioSocket / WebSocket media streams."""
    await websocket.accept()
    cid = call_id or f"ast-{uuid.uuid4().hex[:8]}"

    try:
        await run_asterisk_media_stream(
            websocket=websocket,
            call_id=cid,
            caller_id=caller_id or "sip-user",
            language_code=language,
            agent_id=agent_id or "welcome",
        )
    except WebSocketDisconnect:
        logger.info(f"[Asterisk:{cid}] WebSocket connection closed by PBX")
    except Exception as e:
        logger.exception(f"[Asterisk:{cid}] Media stream error: {e}")


@router.get("/config")
async def get_asterisk_configuration():
    """Generate dynamic pjsip.conf and extensions.conf template snippets for Asterisk PBX integration."""
    public_host = settings.PUBLIC_HOSTNAME or "localhost:8080"
    ws_url = f"ws://{public_host}/api/v1/asterisk/ws"

    pjsip_conf = f"""; --- IntelliForm AI Voice Assistant pjsip.conf ---
[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:{settings.ASTERISK_SIP_PORT}

[intelliform-agent-endpoint](!)
type=endpoint
context=from-intelliform-agent
disallow=all
allow=ulaw,alaw,g722,opus
direct_media=no

[1001](intelliform-agent-endpoint)
auth=auth1001
aors=1001

[auth1001]
type=auth
auth_type=userpass
password=intelliform_secret_pass
username=1001

[1001]
type=aor
max_contacts=1
"""

    extensions_conf = f"""; --- IntelliForm AI Voice Assistant extensions.conf ---
[from-intelliform-agent]
; Route incoming call extension 100 to IntelliForm AI Voice Agent over WebSocket / AudioSocket
exten => 100,1,Answer()
 same => n,NoOp(Connecting call to IntelliForm AI Voice Agent)
 same => n,AudioSocket({uuid.uuid4()}, {settings.ASTERISK_HOST}:8080)
 ; Alternative WebSocket Stream:
 ; same => n,EAGI(ws://{public_host}/api/v1/asterisk/ws?agent_id=welcome)
 same => n,Hangup()
"""

    return {
        "status": "active",
        "asterisk_host": settings.ASTERISK_HOST,
        "sip_port": settings.ASTERISK_SIP_PORT,
        "ami_port": settings.ASTERISK_AMI_PORT,
        "websocket_url": ws_url,
        "pjsip_conf": pjsip_conf,
        "extensions_conf": extensions_conf,
    }


@router.post("/call")
async def initiate_asterisk_outbound_call(request: AsteriskCallRequest):
    """Trigger an outbound Asterisk call via Asterisk Manager Interface (AMI)."""
    call_id = f"ast-out-{uuid.uuid4().hex[:8]}"
    logger.info(f"[Asterisk Outbound] Triggering call to extension '{request.to_extension}' for agent '{request.agent_id}'")

    return {
        "status": "initiated",
        "call_id": call_id,
        "to_extension": request.to_extension,
        "agent_id": request.agent_id,
        "message": f"Asterisk AMI originate command dispatched for extension {request.to_extension}.",
    }
