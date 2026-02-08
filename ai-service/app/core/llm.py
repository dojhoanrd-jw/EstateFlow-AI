from __future__ import annotations

from functools import lru_cache

from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.config import settings


@lru_cache(maxsize=4)
def get_llm(temperature: float = 0.0) -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.OPENAI_MODEL,
        api_key=settings.OPENAI_API_KEY,
        temperature=temperature,
        max_retries=settings.LLM_MAX_RETRIES,
    )


_embeddings: OpenAIEmbeddings | None = None


def get_embeddings() -> OpenAIEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            api_key=settings.OPENAI_API_KEY,
        )
    return _embeddings


@lru_cache(maxsize=256)
def embed_query_cached(text: str) -> tuple[float, ...]:
    # Returns a tuple (hashable) so it can be cached by @lru_cache
    return tuple(get_embeddings().embed_query(text))
