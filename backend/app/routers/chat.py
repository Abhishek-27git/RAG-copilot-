import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.message import ChatRequest, PaginatedMessages
from app.services.deal import DealService
from app.services.chat import ChatService

router = APIRouter(prefix="/deals", tags=["Chat"])


@router.post("/{deal_id}/chat")
async def chat_stream(
    deal_id: uuid.UUID,
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    POST /deals/{deal_id}/chat
    RAG Chat endpoint with real-time SSE streaming response.
    """
    # Verify deal exists and belongs to current user
    deal = await DealService.get_by_id(db, deal_id)
    if not deal or deal.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    return StreamingResponse(
        ChatService.stream_chat_response(db, deal_id, payload.question),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/{deal_id}/messages", response_model=PaginatedMessages)
async def list_messages(
    deal_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    GET /deals/{deal_id}/messages
    Retrieve paginated chat message history for a deal.
    """
    deal = await DealService.get_by_id(db, deal_id)
    if not deal or deal.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    return await ChatService.get_messages(db, deal_id, page, page_size)
