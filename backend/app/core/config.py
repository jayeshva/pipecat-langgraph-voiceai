"""Configuration for the IntelliForm AI voice backend.

Secrets come from `.env` only — never hardcode a key as a default here.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "IntelliForm AI Voice Backend"
    API_V1_STR: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8080
    ENVIRONMENT: str = "development"

    # --- Switchable Service Provider Flags ---
    LLM_PROVIDER: str = "sarvam"  # Options: "sarvam" | "openai" | "gemini" | "bedrock" | "azure"
    STT_PROVIDER: str = "sarvam"  # Options: "sarvam" | "openai" | "gemini" | "bedrock" | "azure"
    TTS_PROVIDER: str = "sarvam"  # Options: "sarvam" | "openai" | "gemini" | "bedrock" | "azure"

    # --- Sarvam AI (speech + language) ---
    SARVAM_API_KEY: str = ""
    SARVAM_LLM_BASE_URL: str = "https://api.sarvam.ai/v1"
    SARVAM_LLM_MODEL: str = "sarvam-105b-conversations"
    SARVAM_STT_MODEL: str = "saarika:v2.5"
    SARVAM_TTS_MODEL: str = "bulbul:v3"
    SARVAM_TTS_VOICE: str = "shruti"

    # --- OpenAI Provider Config ---
    OPENAI_API_KEY: str = ""
    OPENAI_LLM_MODEL: str = "gpt-4o"
    OPENAI_STT_MODEL: str = "whisper-1"
    OPENAI_TTS_MODEL: str = "tts-1"
    OPENAI_TTS_VOICE: str = "alloy"

    # --- Google Gemini Provider Config ---
    GEMINI_API_KEY: str = ""
    GEMINI_LLM_MODEL: str = "gemini-1.5-flash"
    GEMINI_STT_MODEL: str = "gemini-1.5-flash"
    GEMINI_TTS_MODEL: str = "gemini-1.5-flash"

    # --- AWS Bedrock Provider Config ---
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    BEDROCK_LLM_MODEL: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"

    # --- Azure OpenAI Provider Config ---
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_DEPLOYMENT_NAME: str = "gpt-4o"

    # --- LiveKit (browser transport) ---
    LIVEKIT_URL: str = ""
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""

    # --- Twilio (phone transport) ---
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    PUBLIC_HOSTNAME: str = ""
    TWILIO_FROM_NUMBER: str = ""
    TWILIO_DETECT_VOICEMAIL: bool = True
    TWILIO_AMD_TIMEOUT: int = 15
    TWILIO_OUTBOUND_RING_TIMEOUT: int = 30
    TWILIO_LANGUAGE: str = "en-IN"
    TWILIO_SESSION_TIMEOUT_SECONDS: int = 300
    TWILIO_VALIDATE_SIGNATURE: bool = True
    TWILIO_STREAM_TOKEN_TTL_SECONDS: int = 120

    # --- Voice activity detection (Native Pipecat VAD) ---
    VAD_CONFIDENCE: float = 0.65
    VAD_MIN_VOLUME: float = 0.35
    VAD_START_SECS: float = 0.25
    VAD_STOP_SECS: float = 0.6

    SARVAM_HIGH_VAD_SENSITIVITY: bool = True

    # --- Agent behaviour ---
    DEFAULT_LANGUAGE: str = "en-IN"
    MEMORY_TTL_SECONDS: int = 60 * 60 * 24

    WEATHER_API_KEY: str = ""

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:3000",
        "*",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    def require_livekit(self) -> None:
        missing = [
            name
            for name in ("LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET")
            if not getattr(self, name)
        ]
        if missing:
            raise RuntimeError(
                f"Missing LiveKit configuration: {', '.join(missing)}. "
                "Add them to backend/.env — see .env.example."
            )

    def require_sarvam(self) -> None:
        if not self.SARVAM_API_KEY:
            raise RuntimeError(
                "Missing SARVAM_API_KEY. Add it to backend/.env — see .env.example."
            )

    def require_twilio(self) -> None:
        if not self.PUBLIC_HOSTNAME:
            raise RuntimeError(
                "Missing PUBLIC_HOSTNAME. Twilio needs a publicly reachable host to "
                "open the media stream — set it to your ngrok or deployed hostname "
                "(no scheme), e.g. abc123.ngrok-free.app."
            )


settings = Settings()
