import uuid
import logging
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentStatus

logger = logging.getLogger(__name__)


class DocumentService:
    @staticmethod
    async def create(
        db: AsyncSession,
        deal_id: uuid.UUID,
        filename: str,
        file_type: str,
        storage_path: str,
    ) -> Document:
        """Create a new Document row with status=pending."""
        doc = Document(
            deal_id=deal_id,
            filename=filename,
            file_type=file_type,
            storage_path=storage_path,
            status=DocumentStatus.pending,
        )
        db.add(doc)
        await db.flush()  # Populates doc.id and created_at
        return doc

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        document_id: uuid.UUID,
    ) -> Optional[Document]:
        """Retrieve a document by its UUID."""
        stmt = select(Document).where(Document.id == document_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_deal(
        db: AsyncSession,
        deal_id: uuid.UUID,
    ) -> List[Document]:
        """List all documents belonging to a deal, newest first."""
        stmt = (
            select(Document)
            .where(Document.deal_id == deal_id)
            .order_by(Document.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def update_status(
        db: AsyncSession,
        document_id: uuid.UUID,
        status: DocumentStatus,
        error_message: Optional[str] = None,
    ) -> Optional[Document]:
        """
        Update document status — used by the async API layer if needed.
        The Celery worker uses a sync variant of this logic directly.
        """
        doc = await DocumentService.get_by_id(db, document_id)
        if not doc:
            logger.warning("update_status: document %s not found", document_id)
            return None
        doc.status = status
        doc.error_message = error_message
        db.add(doc)
        await db.flush()
        return doc
