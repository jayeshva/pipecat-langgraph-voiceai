"""Authentication for Twilio Webhook signature validation and WebSocket Media Stream tokens."""

import hashlib
import hmac
import time
from typing import Optional, Tuple

from loguru import logger
from twilio.request_validator import RequestValidator

from app.core.config import settings


def _secret() -> bytes:
    return (settings.TWILIO_AUTH_TOKEN or settings.LIVEKIT_API_SECRET or "").encode()


def validate_webhook(url: str, form: dict, signature: Optional[str]) -> bool:
    """Verify X-Twilio-Signature on incoming webhook."""
    if not settings.TWILIO_VALIDATE_SIGNATURE:
        return True

    if not settings.TWILIO_AUTH_TOKEN:
        logger.error("TWILIO_VALIDATE_SIGNATURE is enabled but TWILIO_AUTH_TOKEN is empty — rejecting call.")
        return False

    if not signature:
        logger.warning(f"Twilio webhook to {url} had no X-Twilio-Signature header.")
        return False

    ok = RequestValidator(settings.TWILIO_AUTH_TOKEN).validate(url, form, signature)
    if not ok:
        logger.warning(f"Twilio webhook signature failed for {url}")
    return ok


def mint_stream_token(call_sid: str) -> str:
    """Create short-lived stream token binding socket to call_sid."""
    expires = int(time.time()) + settings.TWILIO_STREAM_TOKEN_TTL_SECONDS
    payload = f"{call_sid}:{expires}"
    mac = hmac.new(_secret(), payload.encode(), hashlib.sha256).hexdigest()[:32]
    return f"{expires}.{mac}"


def verify_stream_token(call_sid: str, token: Optional[str]) -> Tuple[bool, str]:
    """Check stream token handed back on Media Streams socket."""
    if not settings.TWILIO_VALIDATE_SIGNATURE:
        return True, "validation disabled"

    if not _secret():
        return False, "no secret configured to verify stream token"
    if not token:
        return False, "no stream token supplied"

    try:
        expires_str, mac = token.split(".", 1)
        expires = int(expires_str)
    except ValueError:
        return False, "malformed stream token"

    if time.time() > expires:
        return False, "stream token expired"

    expected = hmac.new(_secret(), f"{call_sid}:{expires}".encode(), hashlib.sha256).hexdigest()[:32]

    if not hmac.compare_digest(expected, mac):
        return False, "stream token signature mismatch"

    return True, "ok"
