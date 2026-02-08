from __future__ import annotations

import json
import logging
import re
from functools import lru_cache

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import Runnable

from app.chains.prompts import TAGGER_PROMPT
from app.core.llm import get_llm

logger = logging.getLogger(__name__)

VALID_TAGS: frozenset[str] = frozenset(
    {
        "hot-lead",
        "cold-lead",
        "pricing",
        "financing",
        "site-visit",
        "follow-up",
        "urgent",
        "investor",
        "first-home",
        "family",
        "premium",
        "comparison",
        "early-stage",
        "infonavit",
        "documentation",
        "negotiation",
    }
)


def _parse_tags(raw: str) -> list[str]:
    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().strip("`")

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return [t for t in parsed if isinstance(t, str) and t in VALID_TAGS]
    except json.JSONDecodeError:
        pass

    # Fallback: find anything that looks like a JSON array in the text
    match = re.search(r"\[.*?]", cleaned, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group())
            if isinstance(parsed, list):
                return [t for t in parsed if isinstance(t, str) and t in VALID_TAGS]
        except json.JSONDecodeError:
            pass

    logger.warning("Could not parse tags from LLM output: %s", raw[:200])
    return []


@lru_cache(maxsize=1)
def build_tagger_chain() -> Runnable:
    llm = get_llm(temperature=0.0)
    return TAGGER_PROMPT | llm | StrOutputParser()


async def generate_tags(
    conversation_text: str,
    project_context: str = "",
) -> list[str]:
    chain = build_tagger_chain()
    raw: str = await chain.ainvoke(
        {
            "conversation": conversation_text,
            "project_context": project_context or "No hay contexto adicional disponible.",
        }
    )
    return _parse_tags(raw)
