"""
Document upload and status endpoints.

Routes:
  POST /deals/{deal_id}/documents           — multipart upload, enqueues Celery task
  GET  /deals/{deal_id}/documents           — list all documents for a deal
  GET  /deals/{deal_id}/documents/{doc_id}/status  — lightweight polling endpoint
"""
import uuid
import os
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.document import DocumentOut, DocumentStatusOut
from app.services.deal import DealService
from app.services.document import DocumentService
from app.parsers import SUPPORTED_FILE_TYPES
from app.tasks.process_document import process_document

router = APIRouter(prefix="/deals", tags=["Documents"])
logger = logging.getLogger(__name__)


def _assert_deal_ownership(deal, current_user: User) -> None:
    """Raise 404 if deal is missing or doesn't belong to the current user."""
    if not deal or deal.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )


@router.post(
    "/{deal_id}/documents",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    deal_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Accept a multipart file upload for a deal workspace.

    - Validates file extension (pdf, docx, xlsx only)
    - Saves file to ./storage/{deal_id}/{document_id}/{filename}
    - Creates a Document DB row with status=pending
    - Enqueues a Celery task to parse, chunk, embed, and store the document
    - Returns the Document immediately (status will be 'pending')
    """
    # 1. Verify the deal exists and belongs to this user
    deal = await DealService.get_by_id(db, deal_id)
    _assert_deal_ownership(deal, current_user)

    # 2. Validate file type
    filename = file.filename or "upload"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in SUPPORTED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type '.{ext}'. Allowed: {sorted(SUPPORTED_FILE_TYPES)}",
        )

    # 3. Reserve a document ID so we can build the storage path before DB insert
    doc_id = uuid.uuid4()

    # 4. Build storage path: storage/{deal_id}/{document_id}/{filename}
    storage_dir = os.path.join(
        settings.STORAGE_PATH,
        str(deal_id),
        str(doc_id),
    )
    os.makedirs(storage_dir, exist_ok=True)
    storage_path = os.path.join(storage_dir, filename)

    # 5. Write file to disk
    try:
        contents = await file.read()
        with open(storage_path, "wb") as f:
            f.write(contents)
    except Exception as exc:
        logger.error("Failed to write uploaded file to disk: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file. Please try again.",
        )

    # 6. Create DB row — use the pre-generated doc_id
    from app.models.document import Document, DocumentStatus
    from datetime import datetime, timezone

    doc = Document(
        id=doc_id,
        deal_id=deal_id,
        filename=filename,
        file_type=ext,
        storage_path=storage_path,
        status=DocumentStatus.pending,
        created_at=datetime.now(timezone.utc),
    )
    db.add(doc)
    await db.flush()

    # 7. Enqueue Celery task AFTER the DB row is committed (flush ensures it's written)
    await db.commit()
    process_document.delay(str(doc_id))
    logger.info(
        "Enqueued process_document task for document_id=%s (deal=%s, file=%s)",
        doc_id,
        deal_id,
        filename,
    )

    return doc


@router.get(
    "/{deal_id}/documents",
    response_model=list[DocumentOut],
)
async def list_documents(
    deal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all documents for a deal workspace."""
    deal = await DealService.get_by_id(db, deal_id)
    _assert_deal_ownership(deal, current_user)
    return await DocumentService.list_by_deal(db, deal_id)


@router.get(
    "/{deal_id}/documents/{document_id}/status",
    response_model=DocumentStatusOut,
)
async def get_document_status(
    deal_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lightweight polling endpoint for document processing status.
    Frontend polls this every 2s while status is pending or processing.
    """
    # Validate deal ownership
    deal = await DealService.get_by_id(db, deal_id)
    _assert_deal_ownership(deal, current_user)

    doc = await DocumentService.get_by_id(db, document_id)
    if not doc or doc.deal_id != deal_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return doc
