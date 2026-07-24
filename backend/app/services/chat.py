import json
import logging
import re
import uuid
from typing import AsyncGenerator, List, Dict, Any, Optional

import chromadb
import openai
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

from app.core.config import settings
from app.models.document import Document
from app.models.message import Message

logger = logging.getLogger(__name__)

# Persistent ChromaDB client instance
_chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
_openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
_EMBEDDING_MODEL = "text-embedding-3-small"


class ChatService:
    @staticmethod
    def _get_chroma_collection(deal_id: uuid.UUID) -> Optional[chromadb.Collection]:
        """Retrieve ChromaDB collection scoped to deal_id if it exists."""
        collection_name = f"deal_{str(deal_id).replace('-', '_')}"
        try:
            # Check if collection exists
            collections = _chroma_client.list_collections()
            if not any(c.name == collection_name for c in collections):
                return None
            return _chroma_client.get_collection(name=collection_name)
        except Exception as exc:
            logger.warning("[ChatService] Failed to get collection %s: %s", collection_name, exc)
            return None

    @staticmethod
    async def retrieve_chunks(
        db: AsyncSession,
        deal_id: uuid.UUID,
        question: str,
        top_k: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Embed question with text-embedding-3-small and query ChromaDB collection.
        Returns top_k chunks with populated metadata and document filenames.
        """
        collection = ChatService._get_chroma_collection(deal_id)
        if not collection or collection.count() == 0:
            return []

        # 1. Embed the question
        embed_resp = _openai_client.embeddings.create(
            model=_EMBEDDING_MODEL,
            input=[question]
        )
        q_embedding = embed_resp.data[0].embedding

        # 2. Query ChromaDB
        actual_k = min(top_k, collection.count())
        query_res = collection.query(
            query_embeddings=[q_embedding],
            n_results=actual_k,
            include=["documents", "metadatas", "distances"]
        )

        if not query_res or not query_res.get("documents") or not query_res["documents"][0]:
            return []

        doc_texts = query_res["documents"][0]
        metadatas = query_res["metadatas"][0] if query_res.get("metadatas") else []

        # 3. Collect unique document_ids to resolve filenames from DB
        doc_ids: List[uuid.UUID] = []
        for meta in metadatas:
            if meta and meta.get("document_id"):
                try:
                    doc_ids.append(uuid.UUID(meta["document_id"]))
                except ValueError:
                    pass

        filename_map: Dict[str, str] = {}
        if doc_ids:
            stmt = select(Document.id, Document.filename).where(Document.id.in_(doc_ids))
            res = await db.execute(stmt)
            for row in res.all():
                filename_map[str(row.id)] = row.filename

        # 4. Build normalized chunk list
        chunks: List[Dict[str, Any]] = []
        for i, text in enumerate(doc_texts):
            meta = metadatas[i] if i < len(metadatas) else {}
            doc_id_str = meta.get("document_id", "")
            filename = filename_map.get(doc_id_str, "Document")
            
            # Prefer source_text preview from metadata if present, else fallback to chunk text snippet
            source_snippet = meta.get("source_text") or text[:500]

            chunks.append({
                "document_id": doc_id_str,
                "page_number": int(meta.get("page_number", 1)),
                "chunk_index": int(meta.get("chunk_index", 0)),
                "source_text": source_snippet,
                "filename": filename,
                "full_text": text,
            })

        return chunks

    @staticmethod
    def build_rag_chain():
        """
        Construct LangChain LCEL pipeline.
        Composes ChatPromptTemplate | ChatOpenAI | StrOutputParser.
        """
        system_prompt = (
            "You are an expert AI Due Diligence Copilot analyzing financial, legal, and operational deal documents.\n"
            "Answer the user's question using ONLY the provided context chunks below.\n\n"
            "Rules for answering:\n"
            "1. Cite source chunks using inline numerical markers like [1], [2], etc., corresponding to the provided context chunks.\n"
            "2. You may ONLY cite markers [1] through [{num_chunks}]. Do NOT invent or cite marker numbers outside this range.\n"
            "3. If the answer cannot be found or derived directly from the provided context, state clearly: "
            '"I cannot find this information in the provided deal documents." Do NOT make up information.\n'
            "4. Be concise, precise, and professional.\n\n"
            "Provided Context:\n"
            "{context}"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "{question}"),
        ])

        llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.0,
            streaming=True,
            api_key=settings.OPENAI_API_KEY,
        )

        return prompt | llm | StrOutputParser()

    @staticmethod
    async def stream_chat_response(
        db: AsyncSession,
        deal_id: uuid.UUID,
        question: str
    ) -> AsyncGenerator[str, None]:
        """
        RAG Flow:
        1. Retrieve top 6 chunks from ChromaDB
        2. Build prompt context with [1], [2]... markers
        3. Stream answer tokens via LangChain chain
        4. Post-process answer to validate citations (preventing hallucinated markers)
        5. Persist user and assistant Message records to PostgreSQL
        6. Stream final citations and done event to client
        """
        # Step a & b: Embed and query ChromaDB
        chunks = await ChatService.retrieve_chunks(db, deal_id, question, top_k=6)

        if not chunks:
            # Handle empty context (no documents or no matching chunks)
            empty_answer = "I cannot find this information in the provided deal documents because no indexed documents were found for this deal."
            # Save user message & assistant response
            user_msg = Message(deal_id=deal_id, role="user", content=question, citations=[])
            asst_msg = Message(deal_id=deal_id, role="assistant", content=empty_answer, citations=[])
            db.add_all([user_msg, asst_msg])
            await db.commit()

            yield f"data: {json.dumps({'type': 'token', 'content': empty_answer})}\n\n"
            yield f"data: {json.dumps({'type': 'citations', 'citations': []})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        # Step c: Format context labeled with citation markers [1], [2]...
        context_blocks = []
        for idx, chunk in enumerate(chunks, start=1):
            context_blocks.append(
                f"--- Chunk [{idx}] (Document: {chunk['filename']}, Page: {chunk['page_number']}) ---\n"
                f"{chunk['full_text']}\n"
            )
        formatted_context = "\n".join(context_blocks)

        # Step d: Call LangChain chain with streaming
        rag_chain = ChatService.build_rag_chain()
        full_answer = ""

        try:
            async for token in rag_chain.astream({
                "context": formatted_context,
                "num_chunks": len(chunks),
                "question": question,
            }):
                full_answer += token
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
        except Exception as exc:
            logger.error("[ChatService] Streaming error: %s", exc)
            err_msg = f"\n\n[Error generating complete response: {str(exc)}]"
            full_answer += err_msg
            yield f"data: {json.dumps({'type': 'token', 'content': err_msg})}\n\n"

        # Step e: Parse citation markers & prevent hallucinated citations
        raw_markers = re.findall(r'\[(\d+)\]', full_answer)
        unique_markers = []
        for m in raw_markers:
            m_int = int(m)
            if m_int not in unique_markers:
                unique_markers.append(m_int)

        # Strictly validate cited indices: 1 <= idx <= len(chunks)
        # Filters out any hallucinated numbers greater than len(chunks)
        validated_citations = []
        for idx in unique_markers:
            if 1 <= idx <= len(chunks):
                chunk = chunks[idx - 1]
                validated_citations.append({
                    "document_id": chunk["document_id"],
                    "page_number": chunk["page_number"],
                    "chunk_index": chunk["chunk_index"],
                    "source_text": chunk["source_text"],
                    "filename": chunk["filename"],
                })

        # Persist Messages in DB
        user_msg = Message(deal_id=deal_id, role="user", content=question, citations=[])
        asst_msg = Message(deal_id=deal_id, role="assistant", content=full_answer, citations=validated_citations)
        db.add_all([user_msg, asst_msg])
        await db.commit()

        # Send structured citations event & done event
        yield f"data: {json.dumps({'type': 'citations', 'citations': validated_citations})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    @staticmethod
    async def get_messages(
        db: AsyncSession,
        deal_id: uuid.UUID,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """Fetch paginated chat message history for a deal."""
        page = max(1, page)
        page_size = max(1, min(page_size, 200))

        # Count query
        count_stmt = select(func.count(Message.id)).where(Message.deal_id == deal_id)
        count_res = await db.execute(count_stmt)
        total = count_res.scalar_one()

        # Fetch messages ordered chronologically
        offset = (page - 1) * page_size
        stmt = (
            select(Message)
            .where(Message.deal_id == deal_id)
            .order_by(Message.created_at.asc())
            .offset(offset)
            .limit(page_size)
        )
        res = await db.execute(stmt)
        messages = res.scalars().all()

        return {
            "items": messages,
            "total": total,
            "page": page,
            "page_size": page_size,
        }
