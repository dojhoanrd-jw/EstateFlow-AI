"""FastAPI router with all public endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.models.database import fetch_one
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

router = APIRouter()


# ── POST /analyze ───────────────────────────────────────────────────────


@router.post("/analyze", response_model=AnalyzeResponse)
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


# ── POST /ingest ────────────────────────────────────────────────────────


@router.post("/ingest", response_model=IngestResponse)
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


# ── GET /health ─────────────────────────────────────────────────────────


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Return service health status and vector-store document count."""
    try:
        row = fetch_one("SELECT COUNT(*) AS cnt FROM project_embeddings")
        doc_count = row["cnt"] if row else 0
    except Exception:
        logger.warning("Could not query vector store; reporting 0 docs.")
        doc_count = 0

    return HealthResponse(status="ok", vector_store_docs=doc_count)
