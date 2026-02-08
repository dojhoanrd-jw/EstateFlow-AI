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

_pool: pool.SimpleConnectionPool | None = None


def _get_pool() -> pool.SimpleConnectionPool:
    global _pool
    if _pool is None or _pool.closed:
        logger.info("Creating database connection pool for %s", settings.DATABASE_URL)
        _pool = pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=settings.DATABASE_URL,
        )
    return _pool


@contextmanager
def get_connection() -> Generator[psycopg2.extensions.connection, None, None]:
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
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)


def fetch_all(
    query: str,
    params: tuple[Any, ...] | None = None,
) -> list[dict[str, Any]]:
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            return [dict(row) for row in cur.fetchall()]


def fetch_one(
    query: str,
    params: tuple[Any, ...] | None = None,
) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            row = cur.fetchone()
            return dict(row) if row else None


async def async_execute_query(
    query: str, params: tuple[Any, ...] | None = None
) -> None:
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, partial(execute_query, query, params))


async def async_fetch_all(
    query: str, params: tuple[Any, ...] | None = None
) -> list[dict[str, Any]]:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(fetch_all, query, params))


async def async_fetch_one(
    query: str, params: tuple[Any, ...] | None = None
) -> dict[str, Any] | None:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(fetch_one, query, params))
