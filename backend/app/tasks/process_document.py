"""
Celery task: process_document
-------------------------------
Pipeline per document:
  1. Mark status = processing
  2. Parse file → ParsedDocument (list of pages)
  3. Chunk pages → list[Chunk]
  4. Embed each chunk via OpenAI text-embedding-3-small
  5. Upsert into ChromaDB collection scoped to the deal
  6. Mark status = ready

On any unhandled exception → status = failed, error_message = str(exc)

DB access uses a **synchronous** SQLAlchemy session (psycopg2) because Celery
workers run in a sync context.  The async FastAPI engine is NOT used here.
"""
from __future__ import annotations

import logging
import traceback
import uuid
from typing import Optional, List

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

import chromadb
import openai

from app.celery_app import celery_app
from app.core.config import settings
from app.models.document import Document, DocumentStatus
from app.parsers import get_parser
from app.chunker import RecursiveTextSplitter

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Sync DB engine — separate from the async engine used by FastAPI
# ---------------------------------------------------------------------------
_sync_engine = create_engine(
    settings.SYNC_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=2,
    max_overflow=4,
)
SyncSession = sessionmaker(bind=_sync_engine, expire_on_commit=False)

# ---------------------------------------------------------------------------
# ChromaDB client (embedded, persistent)
# ---------------------------------------------------------------------------
_chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PATH)

# ---------------------------------------------------------------------------
# OpenAI client
# ---------------------------------------------------------------------------
_openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

_EMBEDDING_MODEL = "text-embedding-3-small"
_EMBED_BATCH_SIZE = 100  # OpenAI allows up to 2048 but we stay conservative


def _get_chroma_collection(deal_id: str) -> chromadb.Collection:
    """Return (or create) a ChromaDB collection scoped to a deal."""
    collection_name = f"deal_{deal_id.replace('-', '_')}"
    return _chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def _embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts in batches using OpenAI text-embedding-3-small."""
    all_embeddings: list[list[float]] = []
    for i in range(0, len(texts), _EMBED_BATCH_SIZE):
        batch = texts[i : i + _EMBED_BATCH_SIZE]
        response = _openai_client.embeddings.create(
            model=_EMBEDDING_MODEL,
            input=batch,
        )
        all_embeddings.extend([item.embedding for item in response.data])
    return all_embeddings


def _update_doc_status(
    db: Session,
    doc: Document,
    status: DocumentStatus,
    error_message: str | None = None,
) -> None:
    doc.status = status
    doc.error_message = error_message
    db.add(doc)
    db.commit()


@celery_app.task(bind=True, max_retries=0, name="app.tasks.process_document")
def process_document(self, document_id: str) -> dict:
    """
    Main Celery task: parse → chunk → embed → upsert → mark ready.

    Args:
        document_id: UUID string of the Document row to process.

    Returns:
        dict with 'status' and 'chunk_count' for the Celery result backend.
    """
    doc_uuid = uuid.UUID(document_id)
    logger.info("[process_document] Starting task for document_id=%s", document_id)

    db: Session = SyncSession()
    try:
        # ------------------------------------------------------------------
        # 1. Load document from DB
        # ------------------------------------------------------------------
        doc = db.get(Document, doc_uuid)
        if not doc:
            logger.error("[process_document] Document %s not found in DB", document_id)
            return {"status": "not_found"}

        deal_id_str = str(doc.deal_id)

        # ------------------------------------------------------------------
        # 2. Mark as processing
        # ------------------------------------------------------------------
        _update_doc_status(db, doc, DocumentStatus.processing)
        logger.info("[process_document] status=processing for %s", document_id)

        # ------------------------------------------------------------------
        # 3. Parse file
        # ------------------------------------------------------------------
        try:
            parser = get_parser(doc.file_type)
            parsed_pages = parser.parse(doc.storage_path)
            logger.info(
                "[process_document] Parsed %d page(s) from %s",
                len(parsed_pages),
                doc.filename,
            )
        except Exception as exc:
            logger.error("[process_document] Parsing failed: %s\n%s", exc, traceback.format_exc())
            _update_doc_status(db, doc, DocumentStatus.failed, f"Parse error: {exc}")
            return {"status": "failed", "error": str(exc)}

        # ------------------------------------------------------------------
        # 4. Chunk pages
        # ------------------------------------------------------------------
        try:
            splitter = RecursiveTextSplitter(target_tokens=600, overlap_tokens=100)
            chunks = splitter.split_pages(parsed_pages)
            logger.info("[process_document] Produced %d chunk(s)", len(chunks))
        except Exception as exc:
            logger.error("[process_document] Chunking failed: %s\n%s", exc, traceback.format_exc())
            _update_doc_status(db, doc, DocumentStatus.failed, f"Chunking error: {exc}")
            return {"status": "failed", "error": str(exc)}

        if not chunks:
            logger.warning("[process_document] No chunks produced (empty document?), marking ready")
            _update_doc_status(db, doc, DocumentStatus.ready)
            return {"status": "ready", "chunk_count": 0}

        # ------------------------------------------------------------------
        # 5. Embed chunks
        # ------------------------------------------------------------------
        try:
            texts = [chunk.text for chunk in chunks]
            embeddings = _embed_texts(texts)
            logger.info("[process_document] Embedded %d chunks", len(embeddings))
        except Exception as exc:
            logger.error("[process_document] Embedding failed: %s\n%s", exc, traceback.format_exc())
            _update_doc_status(db, doc, DocumentStatus.failed, f"Embedding error: {exc}")
            return {"status": "failed", "error": str(exc)}

        # ------------------------------------------------------------------
        # 6. Upsert into ChromaDB
        # ------------------------------------------------------------------
        try:
            collection = _get_chroma_collection(deal_id_str)
            ids = [f"{document_id}__chunk_{chunk.chunk_index}" for chunk in chunks]
            metadatas = [
                {
                    "deal_id": deal_id_str,
                    "document_id": document_id,
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "source_text": chunk.text[:500],  # preview stored in metadata
                }
                for chunk in chunks
            ]
            collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
            )
            logger.info(
                "[process_document] Upserted %d chunks into ChromaDB collection 'deal_%s'",
                len(chunks),
                deal_id_str,
            )
        except Exception as exc:
            logger.error("[process_document] ChromaDB upsert failed: %s\n%s", exc, traceback.format_exc())
            _update_doc_status(db, doc, DocumentStatus.failed, f"Vector store error: {exc}")
            return {"status": "failed", "error": str(exc)}

        # ------------------------------------------------------------------
        # 7. Mark as ready
        # ------------------------------------------------------------------
        _update_doc_status(db, doc, DocumentStatus.ready)
        logger.info("[process_document] status=ready for document_id=%s", document_id)
        return {"status": "ready", "chunk_count": len(chunks)}

    except Exception as exc:
        logger.error(
            "[process_document] Unexpected failure for %s: %s\n%s",
            document_id,
            exc,
            traceback.format_exc(),
        )
        # Best-effort status update
        try:
            doc = db.get(Document, doc_uuid)
            if doc:
                _update_doc_status(db, doc, DocumentStatus.failed, f"Unexpected error: {exc}")
        except Exception:
            pass
        return {"status": "failed", "error": str(exc)}
    finally:
        db.close()
