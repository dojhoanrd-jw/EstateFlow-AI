from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class MessageInput(BaseModel):
    sender_type: Literal["agent", "lead"] = Field(
        ..., description="Who sent the message: the sales agent or the lead."
    )
    sender_name: str = Field(..., description="Display name of the sender.")
    content: str = Field(..., description="Plain-text body of the message.")


class AnalyzeRequest(BaseModel):
    conversation_id: str = Field(
        ..., description="Unique identifier for the conversation."
    )
    messages: list[MessageInput] = Field(
        ..., min_length=1, description="Ordered list of conversation messages."
    )


class AnalyzeResponse(BaseModel):
    summary: str = Field(..., description="Concise conversation summary.")
    tags: list[str] = Field(
        default_factory=list, description="Applicable classification tags."
    )
    priority: Literal["high", "medium", "low"] = Field(
        ..., description="Assessed priority level of the lead."
    )


class DocumentInput(BaseModel):
    content: str = Field(..., description="Plain-text content of the document.")
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Arbitrary metadata attached to the chunk.",
    )


class IngestRequest(BaseModel):
    project_name: str = Field(..., description="Real-estate project name.")
    documents: list[DocumentInput] = Field(
        ..., min_length=1, description="Documents to ingest."
    )


class IngestResponse(BaseModel):
    status: str = Field(default="ok")
    chunks_created: int = Field(
        ..., description="Number of vector-store chunks created."
    )


class HealthResponse(BaseModel):
    status: str = Field(default="ok")
    database_status: str = Field(
        default="ok", description="Database connectivity status."
    )
    openai_status: str = Field(
        default="ok", description="OpenAI API connectivity status."
    )
    vector_store_docs: int = Field(
        default=0, description="Total documents in the vector store."
    )
