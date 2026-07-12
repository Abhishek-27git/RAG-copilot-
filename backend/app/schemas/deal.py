import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.deal import DealStatus

class DealCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: DealStatus = DealStatus.active

class DealUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[DealStatus] = None

class DealOut(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: Optional[str]
    status: DealStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
