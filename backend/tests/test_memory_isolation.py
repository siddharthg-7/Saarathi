import pytest
from app.services.memory.memory_service import MemoryService
from app.models import MemoryCreateRequest, MemorySearchRequest

def test_user_isolation_between_accounts():
    user_a = "user_alice_memory"
    user_b = "user_bob_memory"

    MemoryService.clear_memories(user_a)
    MemoryService.clear_memories(user_b)

    # Alice indexes private intellectual property
    mem_a = MemoryService.index_memory(
        uid=user_a,
        req=MemoryCreateRequest(
            sourceType="brain_dump",
            content="Alice's confidential patent formula: Quantum Neural Compression 99X.",
            importance=1.0,
        )
    )

    # Bob searches for Quantum Neural Compression
    bob_search = MemoryService.search_memories(
        uid=user_b,
        req=MemorySearchRequest(query="Quantum Neural Compression patent formula")
    )

    # Bob MUST NOT see Alice's memory
    assert len(bob_search.results) == 0
    for r in bob_search.results:
        assert r.userId == user_b
        assert "Quantum Neural Compression" not in r.content

    # Bob cannot fetch Alice's memory by ID
    bob_fetch = MemoryService.get_memory(uid=user_b, memory_id=mem_a.id)
    assert bob_fetch is None

    # Bob cannot delete Alice's memory
    del_res = MemoryService.delete_memory(uid=user_b, memory_id=mem_a.id)
    alice_fetch = MemoryService.get_memory(uid=user_a, memory_id=mem_a.id)
    assert alice_fetch is not None
    assert alice_fetch.isActive is True
