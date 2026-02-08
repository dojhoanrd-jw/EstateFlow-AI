"""Thin wrapper around psycopg2 for synchronous database access.

Provides a simple connection-pool and helper functions used by the RAG
ingest / retrieval layers.  The pool is created lazily on first use so the
module can be imported safely even when the database is not yet available
(e.g. during testing).
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import contextmanager
from functools import partial
from typing import Any, Generator

import psycopg2
import psycopg2.extras
from psycopg2 import pool

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Connection pool (lazy singleton)
# ---------------------------------------------------------------------------

_pool: pool.SimpleConnectionPool | None = None


def _get_pool() -> pool.SimpleConnectionPool:
    """Return the global connection pool, creating it on first call."""
    global _pool
    if _pool is None or _pool.closed:
        logger.info("Creating database connection pool for %s", settings.DATABASE_URL)
        _pool = pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=settings.DATABASE_URL,
        )
    return _pool


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


@contextmanager
def get_connection() -> Generator[psycopg2.extensions.connection, None, None]:
    """Context manager that checks out a connection and returns it on exit.

    Usage::

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
    """
    p = _get_pool()
    conn = p.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        p.putconn(conn)


def execute_query(query: str, params: tuple[Any, ...] | None = None) -> None:
    """Execute a write query (INSERT / UPDATE / DELETE)."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)


def fetch_all(
    query: str,
    params: tuple[Any, ...] | None = None,
) -> list[dict[str, Any]]:
    """Execute a read query and return all rows as dicts."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            return [dict(row) for row in cur.fetchall()]


def fetch_one(
    query: str,
    params: tuple[Any, ...] | None = None,
) -> dict[str, Any] | None:
    """Execute a read query and return the first row as a dict (or *None*)."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            row = cur.fetchone()
            return dict(row) if row else None


# ---------------------------------------------------------------------------
# Async wrappers (run sync functions in a thread pool)
# ---------------------------------------------------------------------------


async def async_execute_query(
    query: str, params: tuple[Any, ...] | None = None
) -> None:
    """Non-blocking version of :func:`execute_query`."""
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, partial(execute_query, query, params))


async def async_fetch_all(
    query: str, params: tuple[Any, ...] | None = None
) -> list[dict[str, Any]]:
    """Non-blocking version of :func:`fetch_all`."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(fetch_all, query, params))


async def async_fetch_one(
    query: str, params: tuple[Any, ...] | None = None
) -> dict[str, Any] | None:
    """Non-blocking version of :func:`fetch_one`."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(fetch_one, query, params))
