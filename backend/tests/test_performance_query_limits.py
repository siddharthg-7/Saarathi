import pytest
from app.services.firestore_service import (
    _in_memory_tasks,
    _in_memory_telemetry,
    get_user_tasks,
    get_user_tasks_paginated,
    get_user_telemetry_paginated,
)

@pytest.fixture(autouse=True)
def clean_stores():
    _in_memory_tasks.clear()
    _in_memory_telemetry.clear()
    yield
    _in_memory_tasks.clear()
    _in_memory_telemetry.clear()

def test_get_user_tasks_bounded_limit():
    uid = "test-perf-user-1"
    # Seed 150 tasks
    for i in range(150):
        _in_memory_tasks.setdefault(uid, []).append({
            "id": f"task-{i}",
            "title": f"Performance Task {i}",
            "status": "pending" if i % 2 == 0 else "completed",
            "createdAt": f"2026-08-28T0{i//60}:00:00Z"
        })

    # Default limit
    all_tasks = get_user_tasks(uid, limit_count=50)
    assert len(all_tasks) == 50

    # Status filtered with limit
    pending_tasks = get_user_tasks(uid, status="pending", limit_count=20)
    assert len(pending_tasks) == 20
    assert all(t["status"] == "pending" for t in pending_tasks)

def test_get_user_tasks_paginated_cursor_progression():
    uid = "test-perf-user-2"
    # Seed 25 tasks
    for i in range(25):
        _in_memory_tasks.setdefault(uid, []).append({
            "id": f"task-page-{i:02d}",
            "title": f"Paged Task {i}",
            "status": "pending",
            "createdAt": f"2026-08-28T01:{i:02d}:00Z"
        })

    # Page 1 (size 10)
    page1 = get_user_tasks_paginated(uid, page_size=10)
    assert len(page1["items"]) == 10
    assert page1["hasMore"] is True
    assert page1["nextCursor"] == "task-page-09"

    # Page 2 (size 10, using cursor from page 1)
    page2 = get_user_tasks_paginated(uid, page_size=10, last_id=page1["nextCursor"])
    assert len(page2["items"]) == 10
    assert page2["hasMore"] is True
    assert page2["nextCursor"] == "task-page-19"
    assert page2["items"][0]["id"] == "task-page-10"

    # Page 3 (size 10, remaining 5 items)
    page3 = get_user_tasks_paginated(uid, page_size=10, last_id=page2["nextCursor"])
    assert len(page3["items"]) == 5
    assert page3["hasMore"] is False
    assert page3["nextCursor"] is None
    assert page3["items"][0]["id"] == "task-page-20"

def test_get_user_telemetry_paginated():
    uid = "test-perf-user-3"
    for i in range(60):
        _in_memory_telemetry.setdefault(uid, []).append({
            "id": f"evt-{i:03d}",
            "eventType": "task_completed" if i % 2 == 0 else "task_postponed",
            "timestamp": f"2026-08-28T02:{i:02d}:00Z"
        })

    # Query filtered page
    paged_events = get_user_telemetry_paginated(uid, event_type="task_completed", page_size=20)
    assert len(paged_events["items"]) == 20
    assert paged_events["hasMore"] is True
    assert all(e["eventType"] == "task_completed" for e in paged_events["items"])
