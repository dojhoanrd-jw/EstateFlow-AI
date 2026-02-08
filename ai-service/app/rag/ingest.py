from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.core.llm import get_embeddings
from app.models.database import fetch_one, get_connection

logger = logging.getLogger(__name__)

DOCUMENTS_DIR = Path(__file__).resolve().parent / "documents"


def _flatten_json(data: dict[str, Any], prefix: str = "") -> str:
    lines: list[str] = []
    for key, value in data.items():
        full_key = f"{prefix} > {key}" if prefix else key
        if isinstance(value, dict):
            lines.append(_flatten_json(value, full_key))
        elif isinstance(value, list):
            for idx, item in enumerate(value):
                if isinstance(item, dict):
                    lines.append(_flatten_json(item, f"{full_key} > {idx}"))
                else:
                    lines.append(f"{full_key} > {idx}: {item}")
        else:
            lines.append(f"{full_key}: {value}")
    return "\n".join(lines)


def ingest_texts(
    project_name: str,
    texts: list[str],
    metadatas: list[dict[str, Any]] | None = None,
) -> int:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.RAG_CHUNK_SIZE,
        chunk_overlap=settings.RAG_CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", ", ", " ", ""],
    )

    chunks: list[str] = []
    chunk_metas: list[dict[str, Any]] = []
    for idx, text in enumerate(texts):
        meta = (metadatas[idx] if metadatas and idx < len(metadatas) else {})
        parts = splitter.split_text(text)
        for part in parts:
            chunks.append(part)
            chunk_metas.append({**meta, "project_name": project_name})

    if not chunks:
        logger.warning("No chunks produced for project %s", project_name)
        return 0

    embeddings_client = get_embeddings()
    vectors = embeddings_client.embed_documents(chunks)

    insert_sql = """
        INSERT INTO project_embeddings (project_name, chunk_text, embedding, metadata)
        VALUES (%s, %s, %s::vector, %s)
    """

    # Single transaction: all chunks succeed or none are persisted
    with get_connection() as conn:
        with conn.cursor() as cur:
            for chunk_text, vector, meta in zip(chunks, vectors, chunk_metas):
                cur.execute(
                    insert_sql,
                    (project_name, chunk_text, str(vector), json.dumps(meta)),
                )

    logger.info(
        "Ingested %d chunks for project '%s'", len(chunks), project_name
    )
    return len(chunks)


def ingest_project_file(filepath: Path) -> int:
    with open(filepath, encoding="utf-8") as fh:
        data: dict[str, Any] = json.load(fh)

    project_name: str = data.get("project_name", filepath.stem)
    flat_text = _flatten_json(data)
    return ingest_texts(project_name, [flat_text], [{"source_file": filepath.name}])


def ingest_all_project_files() -> int:
    total = 0
    for path in sorted(DOCUMENTS_DIR.glob("*.json")):
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        project_name = data.get("project_name", path.stem)

        # Skip if already ingested
        row = fetch_one(
            "SELECT COUNT(*) AS cnt FROM project_embeddings WHERE project_name = %s",
            (project_name,),
        )
        if row and row["cnt"] > 0:
            logger.info(
                "Project '%s' already has %d chunks; skipping.",
                project_name,
                row["cnt"],
            )
            continue

        total += ingest_project_file(path)

    return total
