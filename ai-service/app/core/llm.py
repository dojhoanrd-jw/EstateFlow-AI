"""Centralized LLM and embeddings factory.

Provides singleton-like access to the ChatOpenAI and OpenAIEmbeddings clients
so that chain modules don't each create their own instances.
"""

from __future__ import annotations

from functools import lru_cache

from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.config import settings


@lru_cache(maxsize=4)
def get_llm(temperature: float = 0.0) -> ChatOpenAI:
    """Return a cached ``ChatOpenAI`` instance for the given *temperature*.

    Includes automatic retry (``max_retries``) so individual chain modules
    don't need to handle transient OpenAI failures.
    """
    return ChatOpenAI(
        model=settings.OPENAI_MODEL,
        api_key=settings.OPENAI_API_KEY,
        temperature=temperature,
        max_retries=settings.LLM_MAX_RETRIES,
    )


_embeddings: OpenAIEmbeddings | None = None


def get_embeddings() -> OpenAIEmbeddings:
    """Return a singleton ``OpenAIEmbeddings`` instance."""
    global _embeddings
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            api_key=settings.OPENAI_API_KEY,
        )
    return _embeddings


@lru_cache(maxsize=256)
def embed_query_cached(text: str) -> tuple[float, ...]:
    """Embed a query string with LRU caching.

    Returns a tuple (hashable) so it can be cached by ``@lru_cache``.
    Used by the RAG retriever for repeated/similar queries.
    """
    return tuple(get_embeddings().embed_query(text))
