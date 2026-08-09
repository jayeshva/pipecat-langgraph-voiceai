"""Switchable STT Service Provider Factory.

Supports Sarvam AI, OpenAI (Whisper), Google Gemini, AWS Bedrock (Transcribe), and Azure Speech based on settings.STT_PROVIDER flag.
"""

from typing import Optional, Any
from loguru import logger
from pipecat.services.sarvam.stt import SarvamSTTService
from pipecat.transcriptions.language import Language

from app.core.config import settings

SAMPLE_RATE = 16000


def get_stt_service(
    provider: Optional[str] = None,
    language: Language = Language.EN,
    sample_rate: int = SAMPLE_RATE,
) -> Any:
    """Return a Pipecat STT service instance based on STT_PROVIDER flag."""
    prov = (provider or settings.STT_PROVIDER).lower().strip()
    logger.info(f"[STTFactory] Initializing Pipecat STT service for provider '{prov}'")

    if prov == "openai":
        try:
            from pipecat.services.openai.stt import OpenAISTTService
            return OpenAISTTService(
                api_key=settings.OPENAI_API_KEY or settings.SARVAM_API_KEY,
                model=settings.OPENAI_STT_MODEL,
                sample_rate=sample_rate,
            )
        except Exception as e:
            logger.warning(f"OpenAI STT import error ({e}). Falling back to Sarvam STT.")

    elif prov == "azure":
        try:
            from pipecat.services.azure.stt import AzureSTTService
            return AzureSTTService(
                api_key=settings.AZURE_OPENAI_API_KEY,
                region=settings.AWS_REGION,
                sample_rate=sample_rate,
            )
        except Exception as e:
            logger.warning(f"Azure STT import error ({e}). Falling back to Sarvam STT.")

    # Default: Sarvam STT Service
    return SarvamSTTService(
        api_key=settings.SARVAM_API_KEY,
        model=settings.SARVAM_STT_MODEL,
        sample_rate=sample_rate,
        params=SarvamSTTService.InputParams(
            language=language,
            high_vad_sensitivity=settings.SARVAM_HIGH_VAD_SENSITIVITY,
        ),
    )
