"""Switchable TTS Service Provider Factory.

Supports Sarvam AI, OpenAI TTS, Piper (Local), Kokoro (Local), Google Gemini, AWS Bedrock, and Azure Speech TTS based on settings.TTS_PROVIDER flag.
"""

from typing import Optional, Any
from loguru import logger
from pipecat.services.sarvam.tts import SarvamTTSService
from pipecat.transcriptions.language import Language
from pipecat.utils.text.markdown_text_filter import MarkdownTextFilter

from app.core.config import settings

SAMPLE_RATE = 16000


def _speech_text_filters() -> list:
    """Strip markdown before synthesis.

    LLMs format for the eye — `**bold**`, `- bullets`, `1.` list markers. Sent
    straight to TTS those are either read aloud literally or split into their
    own one-character utterances ("one dot"), which sounds broken and costs an
    extra synthesis round trip per marker.
    """
    return [
        MarkdownTextFilter(
            params=MarkdownTextFilter.InputParams(
                enable_text_filter=True,
                filter_code=True,
                filter_tables=True,
            )
        )
    ]


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
                text_filters=_speech_text_filters(),
            )
        except Exception as e:
            logger.warning(f"OpenAI TTS import error ({e}). Falling back to Sarvam TTS.")

    elif prov in ("piper", "local"):
        try:
            from pipecat.services.piper.tts import PiperTTSService
            voice_name = settings.PIPER_MODEL_PATH or "en_US-lessac-medium"
            if voice_name.endswith(".onnx"):
                voice_name = voice_name[:-5]
            return PiperTTSService(
                voice_id=voice_name,
                sample_rate=sample_rate,
                text_filters=_speech_text_filters(),
            )
        except Exception as e:
            logger.warning(f"Piper TTS import error ({e}). To use Piper TTS, install 'piper-tts'. Falling back to Sarvam TTS.")

    elif prov == "kokoro":
        try:
            from pipecat.services.openai.tts import OpenAITTSService
            base_url = settings.KOKORO_BASE_URL.rstrip("/")
            if not base_url.endswith("/v1"):
                base_url = f"{base_url}/v1"
            return OpenAITTSService(
                api_key="kokoro",
                base_url=base_url,
                model="kokoro",
                voice=settings.KOKORO_VOICE,
                sample_rate=sample_rate,
                text_filters=_speech_text_filters(),
            )
        except Exception as e:
            logger.warning(f"Kokoro TTS setup error ({e}). Falling back to Sarvam TTS.")

    elif prov == "azure":
        try:
            from pipecat.services.azure.tts import AzureTTSService
            return AzureTTSService(
                api_key=settings.AZURE_OPENAI_API_KEY,
                region=settings.AWS_REGION,
                sample_rate=sample_rate,
                text_filters=_speech_text_filters(),
            )
        except Exception as e:
            logger.warning(f"Azure TTS import error ({e}). Falling back to Sarvam TTS.")

    elif prov == "bedrock":
        # AWS has no TTS under "Bedrock" specifically — Polly is the AWS speech
        # product, using the same account/region/credentials.
        try:
            from pipecat.services.aws.tts import AWSPollyTTSService
            kwargs: dict = {}
            if settings.AWS_ACCESS_KEY_ID:
                kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                kwargs["api_key"] = settings.AWS_SECRET_ACCESS_KEY  # AWS secret key
                if settings.AWS_SESSION_TOKEN:
                    kwargs["aws_session_token"] = settings.AWS_SESSION_TOKEN
            return AWSPollyTTSService(
                region=settings.AWS_REGION,
                sample_rate=sample_rate,
                text_filters=_speech_text_filters(),
                # Leaving `engine` unset makes boto3 omit it from the request,
                # and AWS's own API default for an omitted Engine is
                # "standard" — which several of Polly's newer voices
                # (including AWS_POLLY_VOICE's default "Kajal", a neural-only
                # Indian bilingual voice) reject outright:
                # ValidationException: This voice does not support the
                # selected engine: standard. Set it explicitly.
                settings=AWSPollyTTSService.Settings(
                    voice=settings.AWS_POLLY_VOICE,
                    engine=settings.AWS_POLLY_ENGINE,
                ),
                **kwargs,
            )
        except Exception as e:
            logger.warning(f"AWS Polly TTS unavailable ({e}). Falling back to Sarvam TTS.")

    # Default: Sarvam TTS Service
    return SarvamTTSService(
        api_key=settings.SARVAM_API_KEY,
        model=settings.SARVAM_TTS_MODEL,
        voice_id=settings.SARVAM_TTS_VOICE,
        sample_rate=sample_rate,
        params=SarvamTTSService.InputParams(language=language),
        text_filters=_speech_text_filters(),
    )
