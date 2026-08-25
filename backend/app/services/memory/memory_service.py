import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.models import (
    MemoryCreateRequest,
    MemoryUpdateRequest,
    MemorySearchRequest,
    MemorySearchResponse,
    MemoryItemModel,
    MemoryStatsResponse,
)
from app.services.memory.embedding_provider import (
    embedding_provider,
    compute_content_hash,
    EMBEDDING_MODEL_NAME,
    EMBEDDING_MODEL_VERSION,
    EMBEDDING_DIMENSION,
)
from app.services.memory.supabase_memory_store import supabase_memory_store
from app.services.memory.hybrid_search import hybrid_search_engine

logger = logging.getLogger(__name__)

class MemoryService:
    """Master orchestrator for Saarathi Long-Term Memory & Semantic Retrieval."""

    @classmethod
    def index_memory(cls, uid: str, req: MemoryCreateRequest) -> MemoryItemModel:
        """Create and index a new semantic memory with content hashing and embedding generation."""
        content_hash = compute_content_hash(req.content)

        # Check existing memories for identical content to avoid redundant embedding compute
        existing_memories = supabase_memory_store.list_memories(uid=uid, limit=100)
        for existing in existing_memories:
            if existing.get("contentHash") == content_hash and existing.get("isActive"):
                logger.info(f"Reusing existing memory {existing['id']} with identical content hash.")
                return MemoryItemModel(**existing)

        # Generate dense semantic vector
        embedding = embedding_provider.generate_embedding(req.content)
        summary = req.summary or (req.content[:240] + ("..." if len(req.content) > 240 else ""))

        memory_dict = {
            "id": str(uuid.uuid4()),
            "userId": uid,
            "sourceType": req.sourceType,
            "sourceId": req.sourceId,
            "content": req.content,
            "summary": summary,
            "embedding": embedding,
            "metadata": req.metadata,
            "importance": req.importance,
            "confidence": req.confidence,
            "contentHash": content_hash,
            "embeddingModel": EMBEDDING_MODEL_NAME,
            "embeddingVersion": EMBEDDING_MODEL_VERSION,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "validFrom": req.validFrom,
            "validUntil": req.validUntil,
            "isActive": True,
        }

        saved = supabase_memory_store.upsert_memory(uid=uid, memory_data=memory_dict)
        return MemoryItemModel(**saved)

    @classmethod
    def search_memories(cls, uid: str, req: MemorySearchRequest) -> MemorySearchResponse:
        """Execute hybrid semantic search across user's long-term memory."""
        return hybrid_search_engine.search(
            uid=uid,
            query=req.query,
            filter_spec=req.filter,
            match_threshold=req.matchThreshold,
            match_count=req.matchCount,
            semantic_weight=req.semanticWeight,
            keyword_weight=req.keywordWeight,
        )

    @classmethod
    def get_memory(cls, uid: str, memory_id: str) -> Optional[MemoryItemModel]:
        rec = supabase_memory_store.get_memory(uid=uid, memory_id=memory_id)
        return MemoryItemModel(**rec) if rec else None

    @classmethod
    def list_memories(
        cls,
        uid: str,
        limit: int = 50,
        offset: int = 0,
        source_type: Optional[str] = None,
        is_active: bool = True,
    ) -> List[MemoryItemModel]:
        records = supabase_memory_store.list_memories(
            uid=uid,
            limit=limit,
            offset=offset,
            source_type=source_type,
            is_active=is_active,
        )
        return [MemoryItemModel(**r) for r in records]

    @classmethod
    def update_memory(cls, uid: str, memory_id: str, req: MemoryUpdateRequest) -> Optional[MemoryItemModel]:
        existing = supabase_memory_store.get_memory(uid=uid, memory_id=memory_id)
        if not existing:
            return None

        if req.content is not None:
            existing["content"] = req.content
            existing["contentHash"] = compute_content_hash(req.content)
            existing["embedding"] = embedding_provider.generate_embedding(req.content)

        if req.summary is not None:
            existing["summary"] = req.summary
        if req.metadata is not None:
            existing["metadata"] = req.metadata
        if req.importance is not None:
            existing["importance"] = req.importance
        if req.isActive is not None:
            existing["isActive"] = req.isActive

        saved = supabase_memory_store.upsert_memory(uid=uid, memory_data=existing)
        return MemoryItemModel(**saved)

    @classmethod
    def delete_memory(cls, uid: str, memory_id: str, hard_delete: bool = False) -> bool:
        return supabase_memory_store.delete_memory(uid=uid, memory_id=memory_id, hard_delete=hard_delete)

    @classmethod
    def clear_memories(cls, uid: str) -> int:
        return supabase_memory_store.clear_user_memories(uid=uid)

    @classmethod
    def get_stats(cls, uid: str) -> MemoryStatsResponse:
        stats = supabase_memory_store.get_stats(uid=uid)
        return MemoryStatsResponse(
            totalMemories=stats["totalMemories"],
            activeMemories=stats["activeMemories"],
            countsBySource=stats["countsBySource"],
            embeddingModel=stats["embeddingModel"],
            dimensions=stats["dimensions"],
        )

    @classmethod
    def index_source_item(
        cls,
        uid: str,
        source_type: str,
        source_id: str,
        text: str,
        summary: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        importance: float = 0.6,
    ) -> Optional[MemoryItemModel]:
        """Convenience method to index source data (notes, brain dumps, goals) asynchronously."""
        if not text or len(text.strip()) < 5:
            return None
        try:
            req = MemoryCreateRequest(
                sourceType=source_type, # type: ignore
                sourceId=source_id,
                content=text.strip(),
                summary=summary,
                metadata=metadata or {},
                importance=importance,
            )
            return cls.index_memory(uid=uid, req=req)
        except Exception as e:
            logger.warning(f"Failed to auto-index source {source_type} ({source_id}): {e}")
            return None
