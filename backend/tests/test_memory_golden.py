import pytest
from app.services.memory.memory_service import MemoryService
from app.services.memory.context_builder import MemoryContextBuilder
from app.services.memory.intent_detector import MemoryIntentDetector
from app.models import MemoryCreateRequest, MemorySearchRequest

def test_golden_fixtures_memory_retrieval_and_distinction():
    """
    Golden Fixture:
    Memory A: User wants to build Saarathi.
    Memory B: User wants to build an AI education startup.
    Memory C: User completed DSA yesterday.
    Memory D: User prefers studying DSA in the morning.
    """
    uid = "golden_memory_user_1"
    MemoryService.clear_memories(uid)

    mem_a = MemoryService.index_memory(
        uid=uid,
        req=MemoryCreateRequest(
            sourceType="goal",
            content="User wants to build Saarathi as an AI-powered personal productivity operating system.",
            summary="Building Saarathi OS",
            importance=0.9,
        )
    )

    mem_b = MemoryService.index_memory(
        uid=uid,
        req=MemoryCreateRequest(
            sourceType="brain_dump",
            content="User wants to build an AI education startup for personalized student career discovery.",
            summary="AI Education Startup Idea",
            importance=0.85,
        )
    )

    mem_c = MemoryService.index_memory(
        uid=uid,
        req=MemoryCreateRequest(
            sourceType="task_history",
            content="User completed DSA Graph Revision yesterday at 9 PM.",
            summary="Completed DSA revision",
            importance=0.4,
        )
    )

    mem_d = MemoryService.index_memory(
        uid=uid,
        req=MemoryCreateRequest(
            sourceType="user_preference",
            content="User prefers studying DSA in the morning between 8 AM and 10 AM.",
            summary="Morning DSA preference",
            importance=0.8,
        )
    )

    # Query 1: "What startup idea was I working on?" -> Expected: Memory B
    res_b = MemoryService.search_memories(
        uid=uid,
        req=MemorySearchRequest(query="What startup idea was I working on?", match_count=3)
    )
    assert len(res_b.results) > 0
    assert res_b.results[0].memoryId == mem_b.id
    assert "education startup" in res_b.results[0].content

    # Query 2: "When do I prefer studying DSA?" -> Expected: Memory D
    res_d = MemoryService.search_memories(
        uid=uid,
        req=MemorySearchRequest(query="When do I prefer studying DSA?", match_count=3)
    )
    assert len(res_d.results) > 0
    assert res_d.results[0].memoryId == mem_d.id
    assert "morning" in res_d.results[0].content

    # Query 3: "What am I building?" -> Expected: Memory A
    res_a = MemoryService.search_memories(
        uid=uid,
        req=MemorySearchRequest(query="What am I building?", match_count=3)
    )
    assert len(res_a.results) > 0
    assert res_a.results[0].memoryId == mem_a.id
    assert "Saarathi" in res_a.results[0].content

    # Context Builder verification with provenance
    context_str = MemoryContextBuilder.build_context(res_b.results)
    assert "Brain Dump" in context_str
    assert "AI education startup" in context_str

def test_intent_detection_and_explicit_memory_capture():
    # Questions requiring memory
    assert MemoryIntentDetector.requires_memory_retrieval("What was that startup idea I mentioned three months ago?") is True
    assert MemoryIntentDetector.requires_memory_retrieval("What did I say about my project?") is True
    assert MemoryIntentDetector.requires_memory_retrieval("When do I prefer studying DSA?") is True

    # Simple commands that should NOT trigger memory
    assert MemoryIntentDetector.requires_memory_retrieval("Create task for tomorrow at 8 AM") is False
    assert MemoryIntentDetector.requires_memory_retrieval("Start focus timer") is False
    assert MemoryIntentDetector.requires_memory_retrieval("Hello Kairo") is False

    # Explicit memory capture
    is_exp, fact = MemoryIntentDetector.detect_explicit_memory("Remember that I prefer studying DSA in the morning.")
    assert is_exp is True
    assert fact == "I prefer studying DSA in the morning."
