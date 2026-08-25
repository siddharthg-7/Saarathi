import logging
import math
import re
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory local vector store fallback for local development & offline resiliency
_local_memory_store: Dict[str, Dict[str, Dict[str, Any]]] = {}

class SupabaseMemoryStore:
    """
    Storage layer for pgvector memory embeddings and full-text metadata.
    Connects to Supabase PostgreSQL when credentials exist, and falls back to
    an in-memory vector database when offline or in local test mode.
    """

    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL.rstrip("/") if settings.SUPABASE_URL else ""
        self.service_role_key = settings.SUPABASE_SERVICE_ROLE_KEY or ""
        is_valid_url = self.supabase_url.startswith("https://") and "example" not in self.supabase_url and "supabase.co" in self.supabase_url
        self.is_supabase_configured = bool(is_valid_url and self.service_role_key)
        if self.is_supabase_configured:
            logger.info("Supabase pgvector credentials configured.")
        else:
            logger.info("Supabase credentials not set or in offline mode; using local vector store fallback.")

    def _get_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def upsert_memory(self, uid: str, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert or update a memory record with strict user isolation."""
        memory_id = memory_data.get("id") or str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        record = {
            "id": memory_id,
            "user_id": uid,
            "source_type": memory_data["sourceType"],
            "source_id": memory_data.get("sourceId"),
            "content": memory_data["content"],
            "summary": memory_data.get("summary") or memory_data["content"][:200],
            "embedding": memory_data.get("embedding"),
            "metadata": memory_data.get("metadata", {}),
            "importance": float(memory_data.get("importance", 0.5)),
            "confidence": float(memory_data.get("confidence", 1.0)),
            "content_hash": memory_data.get("contentHash"),
            "embedding_model": memory_data.get("embeddingModel", "all-MiniLM-L6-v2"),
            "embedding_version": memory_data.get("embeddingVersion", "1.0.0"),
            "created_at": memory_data.get("createdAt", now_iso),
            "updated_at": now_iso,
            "last_accessed_at": now_iso,
            "valid_from": memory_data.get("validFrom"),
            "valid_until": memory_data.get("validUntil"),
            "is_active": memory_data.get("isActive", True),
            "deleted_at": memory_data.get("deletedAt"),
        }

        # Update local cache always for instant retrieval
        if uid not in _local_memory_store:
            _local_memory_store[uid] = {}
        _local_memory_store[uid][memory_id] = record

        if self.is_supabase_configured:
            try:
                endpoint = f"{self.supabase_url}/rest/v1/memories"
                with httpx.Client(timeout=5.0) as client:
                    resp = client.post(endpoint, json=record, headers=self._get_headers())
                    if resp.status_code in (200, 201):
                        return self._map_to_camel(record)
            except Exception as e:
                logger.warning(f"Error persisting memory to Supabase ({e}); cached locally.")

        return self._map_to_camel(record)

    def get_memory(self, uid: str, memory_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific memory with user isolation."""
        user_memories = _local_memory_store.get(uid, {})
        record = user_memories.get(memory_id)
        if record and record.get("is_active") and not record.get("deleted_at"):
            return self._map_to_camel(record)

        if self.is_supabase_configured:
            try:
                endpoint = f"{self.supabase_url}/rest/v1/memories?id=eq.{memory_id}&user_id=eq.{uid}&is_active=eq.true"
                with httpx.Client(timeout=5.0) as client:
                    resp = client.get(endpoint, headers=self._get_headers())
                    if resp.status_code == 200:
                        items = resp.json()
                        if items:
                            return self._map_to_camel(items[0])
            except Exception as e:
                logger.warning(f"Error fetching memory from Supabase: {e}")

        return None

    def list_memories(
        self,
        uid: str,
        limit: int = 50,
        offset: int = 0,
        source_type: Optional[str] = None,
        is_active: bool = True
    ) -> List[Dict[str, Any]]:
        """List active memories for an authenticated user."""
        user_memories = _local_memory_store.get(uid, {})
        records = [
            r for r in user_memories.values()
            if (r.get("is_active") == is_active)
            and (not r.get("deleted_at"))
            and (source_type is None or r.get("source_type") == source_type)
        ]
        records.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        paginated = records[offset : offset + limit]
        return [self._map_to_camel(r) for r in paginated]

    def delete_memory(self, uid: str, memory_id: str, hard_delete: bool = False) -> bool:
        """Delete or deactivate a memory with user isolation."""
        now_iso = datetime.now(timezone.utc).isoformat()
        if uid in _local_memory_store and memory_id in _local_memory_store[uid]:
            if hard_delete:
                del _local_memory_store[uid][memory_id]
            else:
                _local_memory_store[uid][memory_id]["is_active"] = False
                _local_memory_store[uid][memory_id]["deleted_at"] = now_iso

        if self.is_supabase_configured:
            try:
                endpoint = f"{self.supabase_url}/rest/v1/memories?id=eq.{memory_id}&user_id=eq.{uid}"
                with httpx.Client(timeout=5.0) as client:
                    if hard_delete:
                        client.delete(endpoint, headers=self._get_headers())
                    else:
                        client.patch(
                            endpoint,
                            json={"is_active": False, "deleted_at": now_iso},
                            headers=self._get_headers()
                        )
            except Exception as e:
                logger.warning(f"Error deleting memory from Supabase: {e}")

        return True

    def clear_user_memories(self, uid: str) -> int:
        """Clear all memories for an authenticated user."""
        count = len(_local_memory_store.get(uid, {}))
        _local_memory_store[uid] = {}

        if self.is_supabase_configured:
            try:
                endpoint = f"{self.supabase_url}/rest/v1/memories?user_id=eq.{uid}"
                with httpx.Client(timeout=5.0) as client:
                    client.delete(endpoint, headers=self._get_headers())
            except Exception as e:
                logger.warning(f"Error clearing memories on Supabase: {e}")

        return count

    def search_vector_local(
        self,
        uid: str,
        query_vector: List[float],
        match_count: int = 10,
        filter_source_type: Optional[str] = None
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Perform cosine similarity search on user's active memories."""
        user_memories = _local_memory_store.get(uid, {})
        scored_items = []

        for record in user_memories.values():
            if not record.get("is_active") or record.get("deleted_at"):
                continue
            if filter_source_type and record.get("source_type") != filter_source_type:
                continue

            emb = record.get("embedding")
            if not emb or len(emb) != len(query_vector):
                continue

            # Dot product since vectors are L2-normalized
            sim = sum(a * b for a, b in zip(query_vector, emb))
            # Clamp between 0.0 and 1.0
            sim = max(0.0, min(1.0, (sim + 1.0) / 2.0 if sim < 0 else sim))
            scored_items.append((record, sim))

        scored_items.sort(key=lambda x: x[1], reverse=True)
        return scored_items[:match_count]

    def search_fulltext_local(
        self,
        uid: str,
        query_text: str,
        match_count: int = 10,
        filter_source_type: Optional[str] = None
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Perform keyword BM25 / token matching on user's active memories."""
        user_memories = _local_memory_store.get(uid, {})
        query_terms = set(re.findall(r"\b\w+\b", query_text.lower()))
        if not query_terms:
            return []

        scored_items = []
        for record in user_memories.values():
            if not record.get("is_active") or record.get("deleted_at"):
                continue
            if filter_source_type and record.get("source_type") != filter_source_type:
                continue

            doc_text = f"{record.get('content', '')} {record.get('summary', '')}".lower()
            doc_words = re.findall(r"\b\w+\b", doc_text)
            if not doc_words:
                continue

            matches = sum(1 for w in query_terms if w in doc_text)
            exact_phrase = 1.0 if query_text.lower() in doc_text else 0.0

            if matches > 0:
                tf = matches / len(query_terms)
                score = min(1.0, tf * 0.7 + exact_phrase * 0.3)
                scored_items.append((record, score))

        scored_items.sort(key=lambda x: x[1], reverse=True)
        return scored_items[:match_count]

    def get_stats(self, uid: str) -> Dict[str, Any]:
        """Return memory counts and statistics for the user."""
        user_memories = _local_memory_store.get(uid, {})
        active = [r for r in user_memories.values() if r.get("is_active") and not r.get("deleted_at")]
        counts_by_source: Dict[str, int] = {}
        for r in active:
            st = r.get("source_type", "unknown")
            counts_by_source[st] = counts_by_source.get(st, 0) + 1

        return {
            "totalMemories": len(user_memories),
            "activeMemories": len(active),
            "countsBySource": counts_by_source,
            "embeddingModel": "all-MiniLM-L6-v2",
            "dimensions": 384,
        }

    def _map_to_camel(self, r: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": r["id"],
            "userId": r["user_id"],
            "sourceType": r["source_type"],
            "sourceId": r.get("source_id"),
            "content": r["content"],
            "summary": r.get("summary"),
            "metadata": r.get("metadata", {}),
            "importance": r.get("importance", 0.5),
            "confidence": r.get("confidence", 1.0),
            "contentHash": r.get("content_hash"),
            "embeddingModel": r.get("embedding_model", "all-MiniLM-L6-v2"),
            "embeddingVersion": r.get("embedding_version", "1.0.0"),
            "createdAt": r.get("created_at"),
            "updatedAt": r.get("updated_at"),
            "lastAccessedAt": r.get("last_accessed_at"),
            "validFrom": r.get("valid_from"),
            "validUntil": r.get("valid_until"),
            "isActive": r.get("is_active", True),
            "deletedAt": r.get("deleted_at"),
        }

supabase_memory_store = SupabaseMemoryStore()
