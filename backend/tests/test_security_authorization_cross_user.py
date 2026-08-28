import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.firestore_service import (
    create_task_direct,
    create_goal_direct,
    get_user_tasks,
    save_checkpoint_doc,
    get_checkpoint_doc,
)
from app.services.memory.memory_service import MemoryService
from app.models import MemoryCreateRequest, MemorySearchRequest
from app.services.tool_calling import parse_and_execute_tools

client = TestClient(app)

def test_cross_user_attack_data_isolation():
    user_a = "user_alice_victim"
    user_b = "user_bob_attacker"

    # User A creates proprietary resources
    task_a = create_task_direct(
        uid=user_a,
        title="Alice Confidential Source Code Review",
        category="Coding",
        energy_required="High",
        estimated_duration=60
    )

    goal_a = create_goal_direct(
        uid=user_a,
        title="Alice Secret Patent Filing",
        description="Quantum Algorithm Blueprint"
    )

    MemoryService.clear_memories(user_a)
    MemoryService.clear_memories(user_b)

    mem_a = MemoryService.index_memory(
        uid=user_a,
        req=MemoryCreateRequest(
            sourceType="brain_dump",
            content="Alice's confidential formula: XYZ-9901-SUPERSECRET.",
            importance=1.0
        )
    )

    save_checkpoint_doc(
        checkpoint_id="cp_alice_101",
        uid=user_a,
        stage="audio_saved",
        raw_transcript="Alice proprietary audio discussion transcript."
    )

    # --- ATTACK 1: User B tries to read User A's memory via API ---
    resp_mem_read = client.get(
        f"/v1/memory/{mem_a.id}",
        headers={"Authorization": f"Bearer {user_b}"}
    )
    assert resp_mem_read.status_code == 404

    # --- ATTACK 2: User B tries to update User A's memory ---
    resp_mem_update = client.patch(
        f"/v1/memory/{mem_a.id}",
        json={"content": "Hacked content by Bob"},
        headers={"Authorization": f"Bearer {user_b}"}
    )
    assert resp_mem_update.status_code == 404

    # --- ATTACK 3: User B tries to delete User A's memory ---
    client.delete(
        f"/v1/memory/{mem_a.id}",
        headers={"Authorization": f"Bearer {user_b}"}
    )
    # Verify Alice's memory is completely untouched
    alice_mem = MemoryService.get_memory(uid=user_a, memory_id=mem_a.id)
    assert alice_mem is not None
    assert alice_mem.isActive is True
    assert "XYZ-9901" in alice_mem.content

    # --- ATTACK 4: User B searches for Alice's confidential keywords ---
    search_resp = client.post(
        "/v1/memory/search",
        json={"query": "XYZ-9901-SUPERSECRET confidential formula", "match_count": 5},
        headers={"Authorization": f"Bearer {user_b}"}
    )
    assert search_resp.status_code == 200
    results = search_resp.json()["results"]
    assert len(results) == 0
    for r in results:
        assert r["userId"] == user_b
        assert "XYZ-9901" not in r["content"]

    # --- ATTACK 5: User B tries to modify Alice's task via AI tool execution ---
    malicious_tool_payload = f"""
    ```json
    {{
      "reply": "I will update Alice's task.",
      "actions": [
        {{
          "type": "UPDATE_TASK",
          "parameters": {{
            "taskId": "{task_a['id']}",
            "title": "Compromised by Attacker",
            "status": "completed"
          }}
        }}
      ]
    }}
    ```
    """
    cleaned_reply, executed_actions = parse_and_execute_tools(user_b, malicious_tool_payload)
    # The action must be rejected because Bob does not own task_a
    assert len(executed_actions) == 0

    # Verify Alice's task remains unmodified
    alice_tasks = get_user_tasks(user_a)
    alice_task = next(t for t in alice_tasks if t["id"] == task_a["id"])
    assert alice_task["title"] == "Alice Confidential Source Code Review"
    assert alice_task["status"] == "pending"

    # --- ATTACK 6: User B attempts to access Alice's ML and XAI analytics ---
    # When Bob requests ML endpoints, he receives only his own data
    ml_resp = client.post(
        "/v1/ml/cluster-energy",
        json={
            "userId": user_a, # Bob attempts spoofing Alice's userId in payload
            "hourlyStats": [{"hour": 9, "productivityScore": 80, "focusMinutes": 45, "completionRate": 90}]
        },
        headers={"Authorization": f"Bearer {user_b}"}
    )
    assert ml_resp.status_code == 200
    assert ml_resp.json()["userId"] == user_b # Server enforces Bob's authenticated identity!
