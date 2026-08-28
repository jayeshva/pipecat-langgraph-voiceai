"""Health & System Diagnostics API Router."""

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])


def _get_active_models():
    # LLM Model
    llm_prov = settings.LLM_PROVIDER.lower()
    if llm_prov == "openai":
        llm_model = settings.OPENAI_LLM_MODEL
    elif llm_prov in ("ollama", "local"):
        llm_model = settings.OLLAMA_MODEL
    elif llm_prov == "gemini":
        llm_model = settings.GEMINI_LLM_MODEL
    elif llm_prov == "bedrock":
        llm_model = settings.BEDROCK_LLM_MODEL
    elif llm_prov == "azure":
        llm_model = settings.AZURE_OPENAI_DEPLOYMENT_NAME
    else:
        llm_model = settings.SARVAM_LLM_MODEL

    # STT Model
    stt_prov = settings.STT_PROVIDER.lower()
    if stt_prov == "openai":
        stt_model = settings.OPENAI_STT_MODEL
    elif stt_prov in ("whisper", "faster-whisper", "local"):
        stt_model = f"faster-whisper-{settings.WHISPER_MODEL}"
    elif stt_prov == "gemini":
        stt_model = settings.GEMINI_STT_MODEL
    else:
        stt_model = settings.SARVAM_STT_MODEL

    # TTS Model & Voice
    tts_prov = settings.TTS_PROVIDER.lower()
    if tts_prov == "openai":
        tts_model = settings.OPENAI_TTS_MODEL
        tts_voice = settings.OPENAI_TTS_VOICE
    elif tts_prov in ("piper", "local"):
        tts_model = "piper-onnx"
        tts_voice = settings.PIPER_MODEL_PATH.split("/")[-1]
    elif tts_prov == "kokoro":
        tts_model = "kokoro-v1"
        tts_voice = settings.KOKORO_VOICE
    elif tts_prov == "gemini":
        tts_model = settings.GEMINI_TTS_MODEL
        tts_voice = "gemini-native"
    else:
        tts_model = settings.SARVAM_TTS_MODEL
        tts_voice = settings.SARVAM_TTS_VOICE

    return {
        "llm": {"provider": settings.LLM_PROVIDER, "model": llm_model},
        "stt": {"provider": settings.STT_PROVIDER, "model": stt_model},
        "tts": {"provider": settings.TTS_PROVIDER, "model": tts_model, "voice": tts_voice},
    }


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "providers": {
            "llm": settings.LLM_PROVIDER,
            "stt": settings.STT_PROVIDER,
            "tts": settings.TTS_PROVIDER,
        },
        "models": _get_active_models(),
        "livekit_configured": bool(settings.LIVEKIT_URL and settings.LIVEKIT_API_KEY),
        "sarvam_configured": bool(settings.SARVAM_API_KEY),
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "twilio_configured": bool(settings.PUBLIC_HOSTNAME),
        "config": {
            "public_hostname": settings.PUBLIC_HOSTNAME,
            "twilio_account_sid_set": bool(settings.TWILIO_ACCOUNT_SID),
            "twilio_auth_token_set": bool(settings.TWILIO_AUTH_TOKEN),
            "twilio_validate_signature": settings.TWILIO_VALIDATE_SIGNATURE,
            "twilio_language": settings.TWILIO_LANGUAGE,
        },
    }
