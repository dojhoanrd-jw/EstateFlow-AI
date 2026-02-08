"""RAG retriever -- cosine-similarity search over project_embeddings.

Uses pgvector's ``<=>`` (cosine distance) operator to find the most relevant
document chunks for a given query.
"""

from __future__ import annotations

import logging

from langchain_openai import OpenAIEmbeddings

from app.config import settings
from app.models.database import fetch_all

logger = logging.getLogger(__name__)


def _get_embeddings_client() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        api_key=settings.OPENAI_API_KEY,
    )


def retrieve_relevant_chunks(
    query: str,
    top_k: int | None = None,
    project_name: str | None = None,
) -> list[str]:
    """Return the *top_k* most relevant text chunks for *query*.

    Parameters
    ----------
    query:
        Free-text search query (will be embedded).
    top_k:
        Number of results to return.  Defaults to ``settings.RAG_TOP_K``.
    project_name:
        Optional filter to restrict results to a single project.

    Returns
    -------
    list[str]
        Ordered list of chunk texts (most relevant first).
    """
    top_k = top_k or settings.RAG_TOP_K

    embeddings_client = _get_embeddings_client()
    query_vector = embeddings_client.embed_query(query)

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

    if rows:
        logger.debug(
            "Retrieved %d chunks (best similarity: %.4f)",
            len(rows),
            rows[0]["similarity"],
        )
    else:
        logger.debug("No chunks found for query: %s", query[:80])

    return [row["chunk_text"] for row in rows]
