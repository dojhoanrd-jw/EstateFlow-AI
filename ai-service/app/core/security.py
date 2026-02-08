"""API key authentication dependency for FastAPI."""

from __future__ import annotations

from fastapi import Header, HTTPException

from app.config import settings


async def verify_api_key(x_api_key: str | None = Header(None)) -> None:
    """Validate the ``X-API-Key`` header against the configured secret.

    When ``AI_SERVICE_API_KEY`` is empty (dev mode), authentication is
    skipped so the service works out-of-the-box without configuration.
    """
    if not settings.AI_SERVICE_API_KEY:
        return

    if not x_api_key or x_api_key != settings.AI_SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
