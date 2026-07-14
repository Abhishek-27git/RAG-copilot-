import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.document import DocumentStatus


class DocumentOut(BaseModel):
    """Full document response — returned after upload."""
    id: uuid.UUID
    deal_id: uuid.UUID
    filename: str
    file_type: str
    status: DocumentStatus
    storage_path: str
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentStatusOut(BaseModel):
    """Lightweight polling response — only status fields."""
    id: uuid.UUID
    status: DocumentStatus
    error_message: Optional[str]

    class Config:
        from_attributes = True
