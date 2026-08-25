import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.firestore_service import create_task_direct, get_user_tasks

client = TestClient(app)

def test_xai_user_scoped_isolation():
    # User A creates a private task
    task_a = create_task_direct(
        uid="user_alice_xai",
        title="Alice Confidential Coding",
        category="Engineering",
        energy_required="High"
    )

    # User B requests task explanation for Alice's task
    # Should safely fallback or derive only from User B's records, never exposing User A's telemetry
    response = client.post(
        "/v1/xai/explain-task",
        json={"taskId": task_a["id"]},
        headers={"Authorization": "Bearer dev-token-bob"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["taskId"] == task_a["id"]
    # Evidence must not contain Alice's private title or unauthenticated data
    for ev in data.get("evidence", []):
        assert "Alice Confidential" not in ev.get("fact", "")

def test_xai_telemetry_event_logging():
    payload = {
        "eventType": "xai_explanation_shown",
        "explanationId": "xai_test_123",
        "taskId": "task_456",
        "metadata": {"view": "today_view"}
    }
    response = client.post(
        "/v1/xai/telemetry",
        json=payload,
        headers={"Authorization": "Bearer dev-token-alice"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "eventId" in response.json()
