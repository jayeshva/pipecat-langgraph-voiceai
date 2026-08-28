"""Switchable LLM Service Provider Factory.

Supports Sarvam AI, OpenAI, Google Gemini, AWS Bedrock, Azure OpenAI, and Local Ollama based on settings.LLM_PROVIDER flag.
"""

from typing import Optional, Any
from loguru import logger
from langchain_openai import ChatOpenAI
from pipecat.services.openai.llm import OpenAILLMService

from app.core.config import settings


def _sarvam_fallback_llm(temperature: float) -> ChatOpenAI:
    """The one fallback LLM every provider branch below drops back to.

    `base_url` MUST be explicit here. Omitting it doesn't mean "use OpenAI's
    default" — the underlying SDK reads the `OPENAI_BASE_URL` environment
    variable if it's set on the machine, silently routing every fallback
    request wherever that stray var happens to point (this is exactly what
    broke Bedrock: an `OPENAI_BASE_URL=http://localhost:11434/v1` left over
    from local Ollama testing hijacked the "safe" fallback path).
    """
    return ChatOpenAI(
        api_key=settings.SARVAM_API_KEY,
        base_url=settings.SARVAM_LLM_BASE_URL,
        model=settings.SARVAM_LLM_MODEL,
        temperature=temperature,
    )


def _bedrock_kwargs() -> dict:
    """Shared AWS credential kwargs for both the LangChain and native Bedrock clients."""
    kwargs = {
        "region_name": settings.AWS_REGION,
    }
    if settings.AWS_ACCESS_KEY_ID:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        # Only pass a session token when one is configured. ASIA-prefixed
        # (temporary/STS) access keys are rejected by AWS without it; a
        # long-lived AKIA-prefixed IAM user key must NOT have one attached.
        if settings.AWS_SESSION_TOKEN:
            kwargs["aws_session_token"] = settings.AWS_SESSION_TOKEN
        elif settings.AWS_ACCESS_KEY_ID.startswith("ASIA"):
            logger.warning(
                "AWS_ACCESS_KEY_ID starts with 'ASIA' (temporary STS credentials) "
                "but AWS_SESSION_TOKEN is empty — AWS will reject this. Get all "
                "three values together from the same `aws sso login` / AssumeRole "
                "response."
            )
    # If neither key is set, omit both kwargs entirely so boto3 falls through
    # to its normal credential chain (profile, instance role, env vars).
    return kwargs


def get_langchain_llm(provider: Optional[str] = None, temperature: float = 0.3) -> Any:
    """Return a LangChain ChatModel instance based on target LLM_PROVIDER flag."""
    prov = (provider or settings.LLM_PROVIDER).lower().strip()
    logger.info(f"[LLMFactory] Initializing LangChain ChatModel for provider '{prov}'")

    if prov == "openai":
        return ChatOpenAI(
            api_key=settings.OPENAI_API_KEY or settings.SARVAM_API_KEY,
            model=settings.OPENAI_LLM_MODEL,
            temperature=temperature,
        )
    elif prov in ("ollama", "local"):
        base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        if not base_url.endswith("/v1"):
            base_url = f"{base_url}/v1"
        return ChatOpenAI(
            base_url=base_url,
            api_key="ollama",
            model=settings.OLLAMA_MODEL,
            temperature=temperature,
        )
    elif prov == "gemini":
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                google_api_key=settings.GEMINI_API_KEY or settings.SARVAM_API_KEY,
                model=settings.GEMINI_LLM_MODEL,
                temperature=temperature,
            )
        except Exception as e:
            logger.warning(f"Google Gemini import error ({e}). Using OpenAI-compatible interface.")
            return _sarvam_fallback_llm(temperature)
    elif prov == "bedrock":
        try:
            from langchain_aws import ChatBedrock
            return ChatBedrock(
                model_id=settings.BEDROCK_LLM_MODEL,
                temperature=temperature,
                **_bedrock_kwargs(),
            )
        except Exception as e:
            logger.warning(f"AWS Bedrock unavailable ({e}). Using Sarvam as fallback.")
            return _sarvam_fallback_llm(temperature)
    elif prov == "azure":
        try:
            from langchain_openai import AzureChatOpenAI
            return AzureChatOpenAI(
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_key=settings.AZURE_OPENAI_API_KEY,
                azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                temperature=temperature,
            )
        except Exception as e:
            logger.warning(f"Azure OpenAI import error ({e}). Using Sarvam as fallback.")
            return _sarvam_fallback_llm(temperature)
    else:
        # Default: Sarvam AI (OpenAI compatible endpoint)
        return _sarvam_fallback_llm(temperature)


def get_pipecat_llm(provider: Optional[str] = None) -> Any:
    """Return a Pipecat LLMService instance based on target LLM_PROVIDER flag."""
    prov = (provider or settings.LLM_PROVIDER).lower().strip()
    logger.info(f"[LLMFactory] Initializing Pipecat LLM service for provider '{prov}'")

    if prov == "openai":
        return OpenAILLMService(
            api_key=settings.OPENAI_API_KEY or settings.SARVAM_API_KEY,
            model=settings.OPENAI_LLM_MODEL,
        )
    elif prov in ("ollama", "local"):
        try:
            from pipecat.services.ollama.llm import OLLamaLLMService, OllamaLLMSettings
            return OLLamaLLMService(
                model=settings.OLLAMA_MODEL,
                settings=OllamaLLMSettings(base_url=settings.OLLAMA_BASE_URL),
            )
        except Exception as e:
            logger.warning(f"Ollama native service import error ({e}). Using OpenAI-compatible interface.")
            base_url = settings.OLLAMA_BASE_URL.rstrip("/")
            if not base_url.endswith("/v1"):
                base_url = f"{base_url}/v1"
            return OpenAILLMService(
                api_key="ollama",
                base_url=base_url,
                model=settings.OLLAMA_MODEL,
            )
    elif prov == "bedrock":
        try:
            from pipecat.services.aws.llm import AWSBedrockLLMService
            kwargs = _bedrock_kwargs()
            return AWSBedrockLLMService(
                model=settings.BEDROCK_LLM_MODEL,
                aws_access_key=kwargs.get("aws_access_key_id"),
                aws_secret_key=kwargs.get("aws_secret_access_key"),
                aws_session_token=kwargs.get("aws_session_token"),
                aws_region=settings.AWS_REGION,
            )
        except Exception as e:
            logger.warning(f"AWS Bedrock (pipecat-native) unavailable ({e}). Using Sarvam as fallback.")
            return OpenAILLMService(
                api_key=settings.SARVAM_API_KEY,
                base_url=settings.SARVAM_LLM_BASE_URL,
                model=settings.SARVAM_LLM_MODEL,
            )
    elif prov == "azure":
        return OpenAILLMService(
            api_key=settings.AZURE_OPENAI_API_KEY or settings.SARVAM_API_KEY,
            base_url=settings.AZURE_OPENAI_ENDPOINT or settings.SARVAM_LLM_BASE_URL,
            model=settings.AZURE_OPENAI_DEPLOYMENT_NAME or settings.SARVAM_LLM_MODEL,
        )
    else:
        # Default: Sarvam AI
        return OpenAILLMService(
            api_key=settings.SARVAM_API_KEY,
            base_url=settings.SARVAM_LLM_BASE_URL,
            model=settings.SARVAM_LLM_MODEL,
        )
