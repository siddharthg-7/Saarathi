import logging
import time
from typing import List, Dict, Any, Optional
from app.models import MemorySearchFilter, HybridSearchResultItem, MemorySearchResponse
from app.services.memory.embedding_provider import embedding_provider
from app.services.memory.supabase_memory_store import supabase_memory_store

logger = logging.getLogger(__name__)

class HybridSearchEngine:
    """
    Executes hybrid search combining dense semantic vector similarity (pgvector)
    and sparse keyword matching (Full-Text Search) with customizable rank weights.
    """

    @classmethod
    def search(
        cls,
        uid: str,
        query: str,
        filter_spec: Optional[MemorySearchFilter] = None,
        match_threshold: float = 0.25,
        match_count: int = 10,
        semantic_weight: float = 0.7,
        keyword_weight: float = 0.3,
    ) -> MemorySearchResponse:
        start_time = time.time()
        source_type_filter = filter_spec.sourceType if filter_spec else None

        # 1. Generate query embedding
        query_vector = embedding_provider.generate_embedding(query)

        # 2. Retrieve vector similarity matches
        vector_matches = supabase_memory_store.search_vector_local(
            uid=uid,
            query_vector=query_vector,
            match_count=max(20, match_count * 2),
            filter_source_type=source_type_filter,
        )
        vector_scores = {r["id"]: score for r, score in vector_matches}

        # 3. Retrieve keyword/full-text matches
        keyword_matches = supabase_memory_store.search_fulltext_local(
            uid=uid,
            query_text=query,
            match_count=max(20, match_count * 2),
            filter_source_type=source_type_filter,
        )
        keyword_scores = {r["id"]: score for r, score in keyword_matches}

        # 4. Union candidate memory IDs
        all_candidate_ids = set(vector_scores.keys()).union(set(keyword_scores.keys()))
        candidates: Dict[str, Dict[str, Any]] = {}

        for r, _ in vector_matches:
            candidates[r["id"]] = r
        for r, _ in keyword_matches:
            candidates[r["id"]] = r

        # 5. Hybrid Scoring and metadata filtering
        scored_results: List[HybridSearchResultItem] = []

        for mem_id in all_candidate_ids:
            record = candidates.get(mem_id)
            if not record:
                continue

            # Metadata and attribute filters
            if filter_spec:
                if filter_spec.category and record.get("metadata", {}).get("category") != filter_spec.category:
                    continue
                if filter_spec.tags:
                    doc_tags = set(record.get("metadata", {}).get("tags", []))
                    if not any(t in doc_tags for t in filter_spec.tags):
                        continue
                if filter_spec.minImportance is not None and record.get("importance", 0.5) < filter_spec.minImportance:
                    continue
                if filter_spec.startDate and record.get("created_at", "") < filter_spec.startDate:
                    continue
                if filter_spec.endDate and record.get("created_at", "") > filter_spec.endDate:
                    continue

            s_score = vector_scores.get(mem_id, 0.0)
            k_score = keyword_scores.get(mem_id, 0.0)
            importance = float(record.get("importance", 0.5))
            confidence = float(record.get("confidence", 1.0))

            # Hybrid scoring equation
            hybrid_score = (
                (semantic_weight * s_score)
                + (keyword_weight * k_score)
                + (importance * 0.1)
            )

            if hybrid_score < match_threshold and s_score < match_threshold and k_score < 0.1:
                continue

            item = HybridSearchResultItem(
                memoryId=record["id"],
                userId=uid,
                sourceType=record["source_type"],
                sourceId=record.get("source_id"),
                content=record["content"],
                summary=record.get("summary"),
                metadata=record.get("metadata", {}),
                importance=importance,
                confidence=confidence,
                semanticScore=round(s_score, 4),
                keywordScore=round(k_score, 4),
                hybridScore=round(hybrid_score, 4),
                createdAt=record.get("created_at", ""),
            )
            scored_results.append(item)

        # 6. Rank by hybrid score descending
        scored_results.sort(key=lambda x: x.hybridScore, reverse=True)

        # 7. Deduplicate nearly identical summaries
        unique_results: List[HybridSearchResultItem] = []
        seen_summaries = set()
        for res in scored_results:
            key = (res.summary or res.content[:60]).lower().strip()
            if key in seen_summaries:
                continue
            seen_summaries.add(key)
            unique_results.append(res)
            if len(unique_results) >= match_count:
                break

        latency_ms = int((time.time() - start_time) * 1000)
        return MemorySearchResponse(
            query=query,
            results=unique_results,
            totalMatches=len(unique_results),
            retrievalLatencyMs=latency_ms,
        )

hybrid_search_engine = HybridSearchEngine()
