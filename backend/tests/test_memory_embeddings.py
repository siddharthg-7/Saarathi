import pytest
from app.services.memory.embedding_provider import (
    embedding_provider,
    compute_content_hash,
    EMBEDDING_DIMENSION,
    EMBEDDING_MODEL_NAME,
    EMBEDDING_MODEL_VERSION,
)
from app.services.memory.memory_service import MemoryService
from app.models import MemoryCreateRequest

def test_embedding_dimensions_and_metadata():
    vec = embedding_provider.generate_embedding("User wants to build an AI education startup.")
    assert len(vec) == 384
    assert embedding_provider.get_dimensions() == 384
    assert embedding_provider.get_model_name() == EMBEDDING_MODEL_NAME
    assert embedding_provider.get_model_version() == EMBEDDING_MODEL_VERSION

def test_content_hashing_and_normalization():
    h1 = compute_content_hash("User wants to build Saarathi.")
    h2 = compute_content_hash("  user WANTS to build saarathi.  ")
    assert h1 == h2
    assert len(h1) == 64

def test_duplicate_content_hash_prevention():
    uid = "test_user_hash_dedup"
    req1 = MemoryCreateRequest(
        sourceType="note",
        content="I prefer studying System Design in the morning.",
        importance=0.8,
    )
    mem1 = MemoryService.index_memory(uid=uid, req=req1)
    
    # Second indexing with identical content should reuse the same memory
    mem2 = MemoryService.index_memory(uid=uid, req=req1)
    assert mem1.id == mem2.id
    assert mem1.contentHash == mem2.contentHash
