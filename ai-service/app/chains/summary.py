"""LangChain chain for generating conversation summaries."""

from __future__ import annotations

from functools import lru_cache

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import Runnable

from app.chains.prompts import SUMMARY_PROMPT
from app.core.llm import get_llm


@lru_cache(maxsize=1)
def build_summary_chain() -> Runnable:
    """Return a cached LCEL chain: prompt | llm | parser."""
    llm = get_llm(temperature=0.3)
    return SUMMARY_PROMPT | llm | StrOutputParser()


async def generate_summary(
    conversation_id: str,
    conversation_text: str,
    project_context: str = "",
) -> str:
    """Invoke the summary chain and return the result.

    Parameters
    ----------
    conversation_id:
        Unique id for tracing / display purposes.
    conversation_text:
        The formatted conversation transcript.
    project_context:
        Relevant RAG chunks about the real-estate project(s).

    Returns
    -------
    str
        A concise Spanish-language summary of the conversation.
    """
    chain = build_summary_chain()
    result: str = await chain.ainvoke(
        {
            "conversation_id": conversation_id,
            "conversation": conversation_text,
            "project_context": project_context or "No hay contexto adicional disponible.",
        }
    )
    return result.strip()
