import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CitationItem(BaseModel):
    document_id: str
    page_number: int
    chunk_index: int
    source_text: str
    filename: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4096, description="User question for RAG copilot")


class MessageOut(BaseModel):
    id: uuid.UUID
    deal_id: uuid.UUID
    role: str
    content: str
    citations: List[CitationItem] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedMessages(BaseModel):
    items: List[MessageOut]
    total: int
    page: int
    page_size: int
