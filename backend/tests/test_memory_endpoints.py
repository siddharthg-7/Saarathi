import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_memory_crud_api_flow():
    # 1. Index a memory
    create_payload = {
        "sourceType": "note",
        "content": "Architecture decision: Use Supabase pgvector for semantic search.",
        "summary": "Supabase pgvector decision",
        "importance": 0.85,
        "metadata": {"category": "architecture", "tags": ["database", "vector"]}
    }
    create_res = client.post(
        "/v1/memory/index",
        json=create_payload,
        headers={"Authorization": "Bearer dev-token-charlie"}
    )
    assert create_res.status_code == 200
    created = create_res.json()
    memory_id = created["id"]
    assert created["sourceType"] == "note"
    assert created["importance"] == 0.85

    # 2. Get the memory by ID
    get_res = client.get(
        f"/v1/memory/{memory_id}",
        headers={"Authorization": "Bearer dev-token-charlie"}
    )
    assert get_res.status_code == 200
    assert get_res.json()["id"] == memory_id

    # 3. Search memories
    search_payload = {"query": "What database was chosen for vector search?"}
    search_res = client.post(
        "/v1/memory/search",
        json=search_payload,
        headers={"Authorization": "Bearer dev-token-charlie"}
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["totalMatches"] >= 1
    assert "pgvector" in search_data["results"][0]["content"]

    # 4. List user memories
    list_res = client.get(
        "/v1/memory",
        headers={"Authorization": "Bearer dev-token-charlie"}
    )
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 5. Get memory stats
    stats_res = client.get(
        "/v1/memory/stats",
        headers={"Authorization": "Bearer dev-token-charlie"}
    )
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["totalMemories"] >= 1
    assert stats["dimensions"] == 384

    # 6. Update memory
    patch_res = client.patch(
        f"/v1/memory/{memory_id}",
        json={"importance": 0.95},
        headers={"Authorization": "Bearer dev-token-charlie"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["importance"] == 0.95

    # 7. Delete memory
    del_res = client.delete(
        f"/v1/memory/{memory_id}",
        headers={"Authorization": "Bearer dev-token-charlie"}
    )
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "ok"
