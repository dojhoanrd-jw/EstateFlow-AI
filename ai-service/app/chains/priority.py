"""LangChain chain for determining lead priority."""

from __future__ import annotations

import logging
from functools import lru_cache

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import Runnable

from app.chains.prompts import PRIORITY_PROMPT
from app.core.llm import get_llm

logger = logging.getLogger(__name__)

VALID_PRIORITIES: frozenset[str] = frozenset({"high", "medium", "low"})


def _parse_priority(raw: str) -> str:
    """Extract a valid priority level from LLM output.

    The model should return a single word but we normalise and validate to
    be safe.
    """
    cleaned = raw.strip().lower().rstrip(".")

    if cleaned in VALID_PRIORITIES:
        return cleaned

    # Check if a valid priority appears anywhere in the output
    for p in ("high", "medium", "low"):
        if p in cleaned:
            return p

    logger.warning(
        "Could not parse priority from LLM output '%s'; defaulting to 'medium'",
        raw[:100],
    )
    return "medium"


@lru_cache(maxsize=1)
def build_priority_chain() -> Runnable:
    """Return a cached LCEL chain: prompt | llm | parser."""
    llm = get_llm(temperature=0.0)
    return PRIORITY_PROMPT | llm | StrOutputParser()


async def generate_priority(
    conversation_text: str,
    project_context: str = "",
) -> str:
    """Invoke the priority chain and return a validated level.

    Parameters
    ----------
    conversation_text:
        The formatted conversation transcript.
    project_context:
        Relevant RAG chunks about the real-estate project(s).

    Returns
    -------
    str
        One of ``"high"``, ``"medium"``, or ``"low"``.
    """
    chain = build_priority_chain()
    raw: str = await chain.ainvoke(
        {
            "conversation": conversation_text,
            "project_context": project_context or "No hay contexto adicional disponible.",
        }
    )
    return _parse_priority(raw)
