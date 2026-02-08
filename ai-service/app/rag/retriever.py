from __future__ import annotations

import logging

from app.config import settings
from app.core.llm import embed_query_cached
from app.models.database import async_fetch_all, fetch_all

logger = logging.getLogger(__name__)


def retrieve_relevant_chunks(
    query: str,
    top_k: int | None = None,
    project_name: str | None = None,
) -> list[str]:
    top_k = top_k or settings.RAG_TOP_K

    query_vector = list(embed_query_cached(query))

    if project_name:
        sql = """
            SELECT chunk_text,
                   1 - (embedding <=> %s::vector) AS similarity
            FROM   project_embeddings
            WHERE  project_name = %s
            ORDER  BY embedding <=> %s::vector
            LIMIT  %s
        """
        params = (str(query_vector), project_name, str(query_vector), top_k)
    else:
        sql = """
            SELECT chunk_text,
                   1 - (embedding <=> %s::vector) AS similarity
            FROM   project_embeddings
            ORDER  BY embedding <=> %s::vector
            LIMIT  %s
        """
        params = (str(query_vector), str(query_vector), top_k)

    rows = fetch_all(sql, params)
    _log_results(rows, query)
    return [row["chunk_text"] for row in rows]


async def async_retrieve_relevant_chunks(
    query: str,
    top_k: int | None = None,
    project_name: str | None = None,
) -> list[str]:
    top_k = top_k or settings.RAG_TOP_K

    query_vector = list(embed_query_cached(query))

    if project_name:
        sql = """
            SELECT chunk_text,
                   1 - (embedding <=> %s::vector) AS similarity
            FROM   project_embeddings
            WHERE  project_name = %s
            ORDER  BY embedding <=> %s::vector
            LIMIT  %s
        """
        params = (str(query_vector), project_name, str(query_vector), top_k)
    else:
        sql = """
            SELECT chunk_text,
                   1 - (embedding <=> %s::vector) AS similarity
            FROM   project_embeddings
            ORDER  BY embedding <=> %s::vector
            LIMIT  %s
        """
        params = (str(query_vector), str(query_vector), top_k)

    rows = await async_fetch_all(sql, params)
    _log_results(rows, query)
    return [row["chunk_text"] for row in rows]


def _log_results(rows: list[dict], query: str) -> None:
    if rows:
        logger.debug(
            "Retrieved %d chunks (best similarity: %.4f)",
            len(rows),
            rows[0]["similarity"],
        )
    else:
        logger.debug("No chunks found for query: %s", query[:80])
