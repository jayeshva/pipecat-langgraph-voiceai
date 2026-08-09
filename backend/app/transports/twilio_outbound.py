"""Outbound calling manager and context store for dialing citizens via Twilio."""

import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, Optional
from loguru import logger

CONTEXT_TTL_SECONDS = 600


@dataclass
class OutboundContext:
    to_number: str
    purpose: str
    language: str
    caller_id: str
    agent_id: str = "welcome"
    created_at: float = field(default_factory=time.time)
    call_sid: Optional[str] = None
    status: str = "queued"


_contexts: Dict[str, OutboundContext] = {}


def _purge_expired() -> None:
    cutoff = time.time() - CONTEXT_TTL_SECONDS
    for key in [k for k, v in _contexts.items() if v.created_at < cutoff]:
        del _contexts[key]


def stash(to_number: str, purpose: str, language: str, caller_id: str, agent_id: str = "welcome") -> str:
    _purge_expired()
    outbound_id = uuid.uuid4().hex[:16]
    _contexts[outbound_id] = OutboundContext(
        to_number=to_number, purpose=purpose, language=language, caller_id=caller_id, agent_id=agent_id
    )
    return outbound_id


def recall(outbound_id: Optional[str]) -> Optional[OutboundContext]:
    if not outbound_id:
        return None
    _purge_expired()
    return _contexts.get(outbound_id)


def mark(outbound_id: str, *, call_sid: Optional[str] = None, status: Optional[str] = None) -> None:
    ctx = _contexts.get(outbound_id)
    if not ctx:
        return
    if call_sid:
        ctx.call_sid = call_sid
    if status:
        ctx.status = status
        logger.info(f"Outbound {outbound_id} -> {status}")


def snapshot() -> Dict[str, dict]:
    _purge_expired()
    return {
        oid: {
            "to": ctx.to_number,
            "status": ctx.status,
            "call_sid": ctx.call_sid,
            "purpose": ctx.purpose,
            "agent_id": ctx.agent_id,
            "age_seconds": round(time.time() - ctx.created_at),
        }
        for oid, ctx in _contexts.items()
    }


def build_outbound_instruction(ctx: OutboundContext) -> str:
    return (
        "You have just placed an outbound call and the person has answered. They "
        "were not expecting you and do not know who is calling.\n\n"
        f"The reason for this call is: {ctx.purpose}\n\n"
        "Open by saying who you are — the IntelliForm AI assistant calling on "
        "behalf of the department — and state the reason in one short sentence. "
        "Then ask whether now is a good time to talk. If they say it is not, "
        "apologise briefly, tell them they can call back on this number, and stop. "
        "If they ask to be removed or sound distressed, acknowledge it, say you "
        "will pass that on, and end the call politely."
    )
