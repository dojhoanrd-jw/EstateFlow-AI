"""FastAPI router with all public endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.llm import get_embeddings
from app.core.security import verify_api_key
from app.models.database import async_fetch_one
from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    HealthResponse,
    IngestRequest,
    IngestResponse,
)
from app.rag.ingest import ingest_texts
from app.services.analyzer import analyze_conversation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1")


# ── POST /v1/analyze ──────────────────────────────────────────────────


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    dependencies=[Depends(verify_api_key)],
)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyse a sales conversation and return summary, tags and priority."""
    try:
        result = await analyze_conversation(
            conversation_id=request.conversation_id,
            messages=request.messages,
        )
        return result
    except Exception as exc:
        logger.exception("Error analysing conversation %s", request.conversation_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── POST /v1/ingest ───────────────────────────────────────────────────


@router.post(
    "/ingest",
    response_model=IngestResponse,
    dependencies=[Depends(verify_api_key)],
)
async def ingest(request: IngestRequest) -> IngestResponse:
    """Ingest documents into the vector store for a given project."""
    try:
        texts = [doc.content for doc in request.documents]
        metadatas = [doc.metadata for doc in request.documents]
        chunks_created = ingest_texts(
            project_name=request.project_name,
            texts=texts,
            metadatas=metadatas,
        )
        return IngestResponse(status="ok", chunks_created=chunks_created)
    except Exception as exc:
        logger.exception("Error ingesting documents for project %s", request.project_name)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── GET /v1/health ────────────────────────────────────────────────────


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Return service health status with database and OpenAI connectivity."""
    db_status = "ok"
    openai_status = "ok"
    doc_count = 0

    # Database check
    try:
        row = await async_fetch_one("SELECT COUNT(*) AS cnt FROM project_embeddings")
        doc_count = row["cnt"] if row else 0
    except Exception:
        logger.warning("Health check: database unreachable.")
        db_status = "unavailable"

    # OpenAI check
    try:
        client = get_embeddings()
        client.embed_query("ping")
    except Exception:
        logger.warning("Health check: OpenAI API unreachable.")
        openai_status = "unavailable"

    overall = "ok" if db_status == "ok" and openai_status == "ok" else "degraded"

    return HealthResponse(
        status=overall,
        database_status=db_status,
        openai_status=openai_status,
        vector_store_docs=doc_count,
    )
