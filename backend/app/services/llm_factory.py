"""Switchable LLM Service Provider Factory.

Supports Sarvam AI, OpenAI, Google Gemini, AWS Bedrock, and Azure OpenAI based on settings.LLM_PROVIDER flag.
"""

from typing import Optional, Any
from loguru import logger
from langchain_openai import ChatOpenAI
from pipecat.services.openai.llm import OpenAILLMService

from app.core.config import settings


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
            return ChatOpenAI(
                api_key=settings.GEMINI_API_KEY or settings.SARVAM_API_KEY,
                model=settings.GEMINI_LLM_MODEL,
                temperature=temperature,
            )
    elif prov == "bedrock":
        try:
            from langchain_aws import ChatBedrock
            return ChatBedrock(
                model_id=settings.BEDROCK_LLM_MODEL,
                region_name=settings.AWS_REGION,
                temperature=temperature,
            )
        except Exception as e:
            logger.warning(f"AWS Bedrock import error ({e}). Using OpenAI-compatible interface.")
            return ChatOpenAI(
                api_key=settings.SARVAM_API_KEY,
                model=settings.SARVAM_LLM_MODEL,
                temperature=temperature,
            )
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
            logger.warning(f"Azure OpenAI import error ({e}). Using standard ChatOpenAI client.")
            return ChatOpenAI(
                api_key=settings.SARVAM_API_KEY,
                model=settings.SARVAM_LLM_MODEL,
                temperature=temperature,
            )
    else:
        # Default: Sarvam AI (OpenAI compatible endpoint)
        return ChatOpenAI(
            api_key=settings.SARVAM_API_KEY,
            base_url=settings.SARVAM_LLM_BASE_URL,
            model=settings.SARVAM_LLM_MODEL,
            temperature=temperature,
        )


def get_pipecat_llm(provider: Optional[str] = None) -> Any:
    """Return a Pipecat LLMService instance based on target LLM_PROVIDER flag."""
    prov = (provider or settings.LLM_PROVIDER).lower().strip()
    logger.info(f"[LLMFactory] Initializing Pipecat LLM service for provider '{prov}'")

    if prov == "openai":
        return OpenAILLMService(
            api_key=settings.OPENAI_API_KEY or settings.SARVAM_API_KEY,
            model=settings.OPENAI_LLM_MODEL,
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
