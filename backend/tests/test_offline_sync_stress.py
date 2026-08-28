import pytest
from app.services.firestore_service import (
    _in_memory_telemetry,
    _in_memory_tasks,
    save_telemetry_batch,
    create_task_direct,
    get_user_tasks,
)

@pytest.fixture(autouse=True)
def clean_stores():
    _in_memory_telemetry.clear()
    _in_memory_tasks.clear()
    yield
    _in_memory_telemetry.clear()
    _in_memory_tasks.clear()

def test_offline_telemetry_batch_deduplication_stress():
    """
    Simulates rapid offline reconnect flushing duplicate telemetry event payloads.
    """
    uid = "test-sync-stress-user"
    
    # 50 unique events + 25 exact duplicates
    events = []
    for i in range(50):
        events.append({
            "id": f"sync-evt-{i}",
            "eventType": "task_completed",
            "taskId": f"task-{i}",
            "timestamp": "2026-08-28T14:00:00Z"
        })
    # Add duplicates
    for i in range(25):
        events.append({
            "id": f"sync-evt-{i}",
            "eventType": "task_completed",
            "taskId": f"task-{i}",
            "timestamp": "2026-08-28T14:00:00Z"
        })

    processed = save_telemetry_batch(uid, events)
    # Deduplication should store at most 50 unique events
    stored_events = _in_memory_telemetry.get(uid, [])
    assert len(stored_events) == 50
    assert processed >= 50

def test_concurrent_task_creation_isolation():
    """
    Tests multiple simulated client instances creating tasks concurrently for distinct users.
    """
    uid_a = "user-sync-a"
    uid_b = "user-sync-b"

    for i in range(20):
        create_task_direct(uid_a, f"Task A-{i}", category="Work")
        create_task_direct(uid_b, f"Task B-{i}", category="Personal")

    tasks_a = get_user_tasks(uid_a)
    tasks_b = get_user_tasks(uid_b)

    assert len(tasks_a) == 20
    assert len(tasks_b) == 20
    assert all(t["category"] == "Work" for t in tasks_a)
    assert all(t["category"] == "Personal" for t in tasks_b)
