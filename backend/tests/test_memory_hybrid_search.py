import pytest
from app.services.memory.memory_service import MemoryService
from app.models import MemoryCreateRequest, MemorySearchRequest, MemorySearchFilter

def test_hybrid_search_scoring_and_ranking():
    uid = "test_user_hybrid_1"
    MemoryService.clear_memories(uid)

    # Index two distinct memories
    MemoryService.index_memory(
        uid=uid,
        req=MemoryCreateRequest(
            sourceType="brain_dump",
            content="My startup idea is to build an AI platform for NSQF vocational course recommendations.",
            summary="AI vocational education startup",
            importance=0.9,
            metadata={"category": "startup", "tags": ["AI", "education"]},
        )
    )

    MemoryService.index_memory(
        uid=uid,
        req=MemoryCreateRequest(
            sourceType="user_preference",
            content="I prefer studying Data Structures and Algorithms at 8 AM in the morning.",
            summary="Morning DSA study preference",
            importance=0.7,
            metadata={"category": "study", "tags": ["DSA", "routine"]},
        )
    )

    # Search for startup idea
    search_req = MemorySearchRequest(query="What was my startup idea about AI education?")
    res = MemoryService.search_memories(uid=uid, req=search_req)

    assert res.totalMatches >= 1
    top_result = res.results[0]
    assert "vocational" in top_result.content or "education" in top_result.content
    assert top_result.hybridScore > 0.3
    assert top_result.semanticScore > 0

def test_hybrid_search_with_metadata_filtering():
    uid = "test_user_filter_1"
    MemoryService.clear_memories(uid)

    MemoryService.index_memory(
        uid=uid,
        req=MemoryCreateRequest(
            sourceType="goal",
            content="Complete Saarathi full-stack release by end of semester.",
            importance=0.8,
            metadata={"category": "development"},
        )
    )

    MemoryService.index_memory(
        uid=uid,
        req=MemoryCreateRequest(
            sourceType="note",
            content="Gym workout split: Chest on Monday, Back on Wednesday.",
            importance=0.5,
            metadata={"category": "fitness"},
        )
    )

    # Filter by category = fitness
    req_filtered = MemorySearchRequest(
        query="release schedule",
        filter=MemorySearchFilter(category="fitness")
    )
    res_filtered = MemoryService.search_memories(uid=uid, req=req_filtered)
    # The development goal should be excluded by the category filter
    for r in res_filtered.results:
        assert r.metadata.get("category") == "fitness"
