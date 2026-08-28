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
    LLM_PROVIDER: str = "local"  # Options: "sarvam" | "openai" | "gemini" | "bedrock" | "azure"
    STT_PROVIDER: str = "local"  # Options: "sarvam" | "openai" | "gemini" | "bedrock" | "azure"
    TTS_PROVIDER: str = "local"  # Options: "sarvam" | "openai" | "gemini" | "bedrock" | "azure"

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

    # --- AWS Bedrock / Transcribe / Polly Provider Config ---
    # Bedrock ("bedrock") supplies the LLM only — LLM_PROVIDER=bedrock uses it.
    # AWS has no unified speech product under that name: STT_PROVIDER=bedrock
    # and TTS_PROVIDER=bedrock route to Amazon Transcribe and Polly respectively,
    # under the same credentials/region.
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    # Required alongside the two keys above whenever they are temporary STS
    # credentials (AWS_ACCESS_KEY_ID starting with "ASIA" rather than "AKIA") —
    # e.g. from `aws sso login` or an assumed role. Those also expire, typically
    # within 1-12 hours, and must be refreshed periodically; a long-lived IAM
    # user's AKIA/secret pair needs no session token and does not expire.
    AWS_SESSION_TOKEN: str = ""
    # Must be a real Bedrock model id, and that specific model must be enabled
    # for your account in AWS_REGION: Bedrock console -> Model access. Model
    # availability varies by region; us-east-1 has the widest selection.
    BEDROCK_LLM_MODEL: str = "anthropic.claude-haiku-4-5-20251001-v1:0"
    # Polly neural voice used when TTS_PROVIDER=bedrock. "Kajal" is Polly's
    # Indian English/Hindi bilingual neural voice — matches this project's
    # other Indic-language defaults.
    AWS_POLLY_VOICE: str = "Kajal"
    # Must match the voice: newer Polly voices (Kajal included) are neural-only
    # and reject engine="standard" with ValidationException. Check the voice in
    # the Polly console's "Supported engines" column before changing either.
    AWS_POLLY_ENGINE: str = "neural"

    # --- Azure OpenAI Provider Config ---
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_DEPLOYMENT_NAME: str = "gpt-4o"

    # --- Local Models Provider Config (Ollama, Faster-Whisper, Piper, Kokoro) ---
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    WHISPER_MODEL: str = "base"
    WHISPER_DEVICE: str = "auto"

    PIPER_MODEL_PATH: str = "voices/en_US-lessac-medium.onnx"

    KOKORO_BASE_URL: str = "http://localhost:8880"
    KOKORO_VOICE: str = "af_heart"

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

    # --- Asterisk SIP / AudioSocket Telephony Config ---
    ASTERISK_ENABLED: bool = True
    ASTERISK_HOST: str = "127.0.0.1"
    ASTERISK_SIP_PORT: int = 5060
    ASTERISK_AMI_PORT: int = 5038
    ASTERISK_AMI_USER: str = "admin"
    ASTERISK_AMI_SECRET: str = "amp111"
    ASTERISK_WEBSOCKET_PATH: str = "/api/v1/asterisk/ws"

    # --- Voice activity detection (Native Pipecat VAD) ---
    # VAD is the raw speech/silence signal. It does NOT decide the end of a turn
    # on its own — Pipecat's smart-turn analyzer does, using a model trained
    # against stop_secs=0.2. Raising stop_secs both delays every reply and
    # invalidates that model's latency calibration, which Pipecat warns about at
    # runtime. Leave it at 0.2 and let smart-turn judge when the caller is done.
    VAD_CONFIDENCE: float = 0.65
    VAD_MIN_VOLUME: float = 0.35
    VAD_START_SECS: float = 0.25
    VAD_STOP_SECS: float = 0.2

    # How long the smart-turn model keeps listening after it judges an utterance
    # unfinished — "my name is ..." — before giving up and answering anyway.
    # This is what lets a caller pause mid-sentence to recall a phone number or
    # a percentage without being cut off. Raise it for forms and dictation;
    # lower it for snappy Q&A where long pauses mean the caller is done.
    TURN_WAIT_SECS: float = 3.0

    # How to stop the agent transcribing its own voice.
    #   "barge_in"  — the caller may interrupt at any time (production default,
    #                 matches ElevenLabs/Sarvam). Relies on the browser's WebRTC
    #                 echo cancellation, so it needs a headset or a device with
    #                 working AEC.
    #   "always"    — mute the caller's audio entirely while the agent speaks.
    #                 Bulletproof against echo on open speakers, but the caller
    #                 cannot interrupt mid-sentence.
    ECHO_SUPPRESSION: str = "barge_in"

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
        if self.STT_PROVIDER == "sarvam" or self.TTS_PROVIDER == "sarvam" or self.LLM_PROVIDER == "sarvam":
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
