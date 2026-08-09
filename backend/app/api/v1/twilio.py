"""Twilio Webhook & WebSocket Media Streams API Router."""

import asyncio
import json
from xml.sax.saxutils import escape as xml_escape

from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from twilio.rest import Client as TwilioClient
from loguru import logger

from app.core.config import settings
from app.transports import twilio_outbound
from app.transports.twilio_auth import mint_stream_token, validate_webhook, verify_stream_token
from app.transports.twilio_inbound import run_twilio_media_stream

router = APIRouter(prefix="/twilio", tags=["Twilio Telephony"])


@router.post("/voice")
async def twilio_voice(request: Request):
    """TwiML webhook endpoint for inbound phone calls."""
    form_data = await request.form()
    form = {k: str(v) for k, v in form_data.items()}

    host = settings.PUBLIC_HOSTNAME or request.headers.get(
        "X-Forwarded-Host", request.headers.get("Host", "")
    )
    query = f"?{request.url.query}" if request.url.query else ""
    public_url = f"https://{host}{request.url.path}{query}"
    if not validate_webhook(public_url, form, request.headers.get("X-Twilio-Signature")):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    try:
        settings.require_twilio()
        settings.require_sarvam()
    except RuntimeError as e:
        return Response(
            content='<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, assistant unavailable.</Say></Response>',
            media_type="application/xml",
        )

    from_number = form.get("From", "unknown")
    call_sid = form.get("CallSid", "")
    ob_id = request.query_params.get("ob")
    ob_ctx = twilio_outbound.recall(ob_id)

    if ob_id and not ob_ctx:
        return Response(
            content='<?xml version="1.0" encoding="UTF-8"?><Response><Say>Call context expired.</Say><Hangup/></Response>',
            media_type="application/xml",
        )

    if ob_ctx:
        twilio_outbound.mark(ob_id, call_sid=call_sid, status="answered")
        answered_by = form.get("AnsweredBy", "")
        if answered_by.startswith("machine"):
            twilio_outbound.mark(ob_id, status=f"voicemail ({answered_by})")
            return Response(
                content='<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
                media_type="application/xml",
            )
        caller_identity = ob_ctx.to_number
        language = ob_ctx.language
        agent_id = ob_ctx.agent_id
    else:
        caller_identity = from_number
        language = settings.TWILIO_LANGUAGE
        agent_id = request.query_params.get("agent_id") or "welcome"

    ws_url = f"wss://{settings.PUBLIC_HOSTNAME}{settings.API_V1_STR}/twilio/ws"

    params = [
        f'<Parameter name="callerId" value="{xml_escape(caller_identity)}"/>',
        f'<Parameter name="language" value="{xml_escape(language)}"/>',
        f'<Parameter name="agentId" value="{xml_escape(agent_id)}"/>',
        f'<Parameter name="streamToken" value="{xml_escape(mint_stream_token(call_sid))}"/>',
    ]
    if ob_id:
        params.append(f'<Parameter name="outboundId" value="{xml_escape(ob_id)}"/>')

    twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="{xml_escape(ws_url)}">{"".join(params)}</Stream></Connect></Response>'
    return Response(content=twiml, media_type="application/xml")


@router.websocket("/ws")
async def twilio_ws(websocket: WebSocket):
    """Twilio Media Streams WebSocket endpoint."""
    await websocket.accept()

    try:
        await websocket.receive_text()
        start_msg = json.loads(await websocket.receive_text())
    except (WebSocketDisconnect, json.JSONDecodeError, KeyError) as e:
        logger.warning(f"Twilio media stream ended during handshake: {e}")
        return

    start = start_msg.get("start", {})
    stream_sid = start.get("streamSid", "")
    call_sid = start.get("callSid", "")
    custom = start.get("customParameters", {}) or {}
    caller_id = custom.get("callerId") or f"phone-{call_sid[-8:]}"
    language = custom.get("language") or settings.TWILIO_LANGUAGE
    agent_id = custom.get("agentId") or "welcome"

    if not stream_sid:
        await websocket.close(code=1008)
        return

    ok, reason = verify_stream_token(call_sid, custom.get("streamToken"))
    if not ok:
        await websocket.close(code=1008)
        return

    ob_ctx = twilio_outbound.recall(custom.get("outboundId"))
    opening = twilio_outbound.build_outbound_instruction(ob_ctx) if ob_ctx else None

    try:
        await run_twilio_media_stream(
            websocket=websocket,
            stream_sid=stream_sid,
            call_sid=call_sid,
            caller_id=caller_id,
            language_code=language,
            opening_instruction=opening,
            agent_id=agent_id,
        )
    except WebSocketDisconnect:
        logger.info(f"Twilio caller {caller_id} disconnected")
    except Exception as e:
        logger.exception(f"Twilio call {call_sid} failed: {e}")


@router.post("/status")
async def twilio_status(request: Request):
    form_data = await request.form()
    form = {k: str(v) for k, v in form_data.items()}

    host = settings.PUBLIC_HOSTNAME or request.headers.get("Host", "")
    query = f"?{request.url.query}" if request.url.query else ""
    public_url = f"https://{host}{request.url.path}{query}"
    if not validate_webhook(public_url, form, request.headers.get("X-Twilio-Signature")):
        raise HTTPException(status_code=403, detail="Invalid signature")

    ob_id = request.query_params.get("ob")
    status = form.get("CallStatus", "unknown")
    if ob_id:
        twilio_outbound.mark(ob_id, call_sid=form.get("CallSid"), status=status)
    return Response(status_code=204)


@router.post("/amd")
async def twilio_amd(request: Request):
    form_data = await request.form()
    form = {k: str(v) for k, v in form_data.items()}

    host = settings.PUBLIC_HOSTNAME or request.headers.get("Host", "")
    query = f"?{request.url.query}" if request.url.query else ""
    if not validate_webhook(f"https://{host}{request.url.path}{query}", form, request.headers.get("X-Twilio-Signature")):
        raise HTTPException(status_code=403, detail="Invalid signature")

    ob_id = request.query_params.get("ob")
    answered_by = form.get("AnsweredBy", "")
    call_sid = form.get("CallSid", "")

    if answered_by.startswith("machine") and call_sid:
        if ob_id:
            twilio_outbound.mark(ob_id, status=f"voicemail ({answered_by})")
        try:
            client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            await asyncio.to_thread(client.calls(call_sid).update, status="completed")
            logger.info(f"Hung up {call_sid} — voicemail detected")
        except Exception as e:
            logger.warning(f"Could not hang up {call_sid} after AMD: {e}")

    return Response(status_code=204)
