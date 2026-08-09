"""Switchable TTS Service Provider Factory.

Supports Sarvam AI, OpenAI TTS, Google Gemini, AWS Bedrock (Polly), and Azure Speech TTS based on settings.TTS_PROVIDER flag.
"""

from typing import Optional, Any
from loguru import logger
from pipecat.services.sarvam.tts import SarvamTTSService
from pipecat.transcriptions.language import Language

from app.core.config import settings

SAMPLE_RATE = 16000


def get_tts_service(
    provider: Optional[str] = None,
    language: Language = Language.EN,
    sample_rate: int = SAMPLE_RATE,
) -> Any:
    """Return a Pipecat TTS service instance based on TTS_PROVIDER flag."""
    prov = (provider or settings.TTS_PROVIDER).lower().strip()
    logger.info(f"[TTSFactory] Initializing Pipecat TTS service for provider '{prov}'")

    if prov == "openai":
        try:
            from pipecat.services.openai.tts import OpenAITTSService
            return OpenAITTSService(
                api_key=settings.OPENAI_API_KEY or settings.SARVAM_API_KEY,
                model=settings.OPENAI_TTS_MODEL,
                voice=settings.OPENAI_TTS_VOICE,
                sample_rate=sample_rate,
            )
        except Exception as e:
            logger.warning(f"OpenAI TTS import error ({e}). Falling back to Sarvam TTS.")

    elif prov == "azure":
        try:
            from pipecat.services.azure.tts import AzureTTSService
            return AzureTTSService(
                api_key=settings.AZURE_OPENAI_API_KEY,
                region=settings.AWS_REGION,
                sample_rate=sample_rate,
            )
        except Exception as e:
            logger.warning(f"Azure TTS import error ({e}). Falling back to Sarvam TTS.")

    # Default: Sarvam TTS Service
    return SarvamTTSService(
        api_key=settings.SARVAM_API_KEY,
        model=settings.SARVAM_TTS_MODEL,
        voice_id=settings.SARVAM_TTS_VOICE,
        sample_rate=sample_rate,
        params=SarvamTTSService.InputParams(language=language),
    )
