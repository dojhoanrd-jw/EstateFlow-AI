"""EstateFlow AI Service -- FastAPI application entry-point."""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.models.database import async_fetch_one
from app.rag.ingest import ingest_all_project_files

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan handler.

    On startup:
    - Check whether the ``project_embeddings`` table already has data.
    - If empty, auto-ingest the bundled JSON project files so the RAG
      pipeline is ready to go from the first request.
    """
    logger.info("EstateFlow AI Service starting up...")

    try:
        row = await async_fetch_one("SELECT COUNT(*) AS cnt FROM project_embeddings")
        doc_count = row["cnt"] if row else 0

        if doc_count == 0:
            logger.info(
                "Vector store is empty -- auto-ingesting project documents..."
            )
            total = ingest_all_project_files()
            logger.info("Auto-ingest complete: %d chunks created.", total)
        else:
            logger.info(
                "Vector store already contains %d chunks; skipping auto-ingest.",
                doc_count,
            )
    except Exception:
        logger.warning(
            "Could not connect to the database during startup. "
            "RAG features will be unavailable until the database is reachable. "
            "You can trigger ingestion later via POST /v1/ingest.",
            exc_info=True,
        )

    yield  # Application is running

    logger.info("EstateFlow AI Service shutting down.")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


app = FastAPI(
    title="EstateFlow AI Service",
    description=(
        "AI-powered conversation analysis for a real-estate CRM. "
        "Uses LangChain + RAG with pgvector to generate summaries, "
        "tags, and priority levels from sales conversations."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS -- restrict in production, allow everything in dev
_origins: list[str] = (
    [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
    if settings.CORS_ORIGINS
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------


@app.middleware("http")
async def log_requests(request: Request, call_next) -> Response:  # type: ignore[type-arg]
    """Log every HTTP request with method, path, status and duration."""
    start = time.perf_counter()
    response: Response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1_000
    logger.info(
        "[request] %s %s -> %d (%.0fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


app.include_router(router)
