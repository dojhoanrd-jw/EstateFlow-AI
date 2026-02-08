"""Main orchestrator for conversation analysis.

Brings together RAG retrieval and the three LangChain chains (summary,
tagger, priority) to produce a complete analysis of a sales conversation.
"""

from __future__ import annotations

import asyncio
import logging
import re

from app.chains.priority import generate_priority
from app.chains.summary import generate_summary
from app.chains.tagger import generate_tags
from app.models.schemas import AnalyzeResponse, MessageInput
from app.rag.retriever import retrieve_relevant_chunks

logger = logging.getLogger(__name__)

# Known project names (lower-case) for mention detection
_PROJECT_KEYWORDS: dict[str, str] = {
    "torre alvarez": "Torre Alvarez",
    "torre álvarez": "Torre Alvarez",
    "alvarez": "Torre Alvarez",
    "residencial del parque": "Residencial del Parque",
    "residencial parque": "Residencial del Parque",
    "del parque": "Residencial del Parque",
    "lomas verdes": "Lomas Verdes",
    "lomas": "Lomas Verdes",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _format_conversation(messages: list[MessageInput]) -> str:
    """Turn a list of ``MessageInput`` into a readable transcript."""
    lines: list[str] = []
    for msg in messages:
        role_label = "Asesor" if msg.sender_type == "agent" else "Prospecto"
        lines.append(f"[{role_label} - {msg.sender_name}]: {msg.content}")
    return "\n".join(lines)


def _extract_project_mentions(messages: list[MessageInput]) -> list[str]:
    """Return canonical project names mentioned in the conversation."""
    full_text = " ".join(m.content for m in messages).lower()
    found: set[str] = set()

    # Sort keywords longest-first so "residencial del parque" matches before
    # the shorter "del parque".
    for keyword in sorted(_PROJECT_KEYWORDS, key=len, reverse=True):
        if re.search(re.escape(keyword), full_text):
            found.add(_PROJECT_KEYWORDS[keyword])

    return list(found)


def _build_rag_context(messages: list[MessageInput]) -> str:
    """Retrieve relevant project info via RAG.

    1. Detect which projects are mentioned.
    2. For each mentioned project, retrieve chunks filtered by project name.
    3. If no project is explicitly mentioned, do a broad semantic search
       using the first few messages as the query.
    """
    projects = _extract_project_mentions(messages)
    chunks: list[str] = []

    if projects:
        for project_name in projects:
            project_chunks = retrieve_relevant_chunks(
                query=" ".join(m.content for m in messages[:5]),
                top_k=3,
                project_name=project_name,
            )
            chunks.extend(project_chunks)
    else:
        # Broad search using the conversation content
        query = " ".join(m.content for m in messages[:5])
        chunks = retrieve_relevant_chunks(query=query, top_k=4)

    if not chunks:
        return ""

    return "\n---\n".join(chunks)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def analyze_conversation(
    conversation_id: str,
    messages: list[MessageInput],
) -> AnalyzeResponse:
    """Run full analysis pipeline on a conversation.

    Steps
    -----
    1. Format the conversation into a transcript string.
    2. Query RAG for relevant project context.
    3. Run summary, tagger, and priority chains **in parallel**.
    4. Assemble and return the ``AnalyzeResponse``.
    """
    conversation_text = _format_conversation(messages)

    # RAG retrieval (synchronous -- runs fast)
    project_context = _build_rag_context(messages)

    logger.info(
        "Analysing conversation %s (%d messages, %d chars of RAG context)",
        conversation_id,
        len(messages),
        len(project_context),
    )

    # Launch the three chains concurrently
    summary_task = generate_summary(
        conversation_id=conversation_id,
        conversation_text=conversation_text,
        project_context=project_context,
    )
    tags_task = generate_tags(
        conversation_text=conversation_text,
        project_context=project_context,
    )
    priority_task = generate_priority(
        conversation_text=conversation_text,
        project_context=project_context,
    )

    summary, tags, priority = await asyncio.gather(
        summary_task, tags_task, priority_task
    )

    return AnalyzeResponse(
        summary=summary,
        tags=tags,
        priority=priority,
    )
