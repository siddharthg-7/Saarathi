import pytest
from app.services.analytics_service import aggregate_daily
from app.services.firestore_service import (
    _in_memory_telemetry,
    _in_memory_tasks,
)

@pytest.fixture(autouse=True)
def clean_stores():
    _in_memory_telemetry.clear()
    _in_memory_tasks.clear()
    yield
    _in_memory_telemetry.clear()
    _in_memory_tasks.clear()

def test_analytics_aggregation_deterministic_performance():
    uid = "test-analytics-perf-user"
    # Seed 100 events
    for i in range(100):
        _in_memory_telemetry.setdefault(uid, []).append({
            "id": f"event-{i}",
            "eventType": "task_completed" if i % 2 == 0 else "task_postponed",
            "timestamp": "2026-08-28T10:00:00Z"
        })

    # Run calculation multiple times to ensure deterministic O(N) performance
    res1 = aggregate_daily(uid, target_date="2026-08-28", user_tz="UTC")
    res2 = aggregate_daily(uid, target_date="2026-08-28", user_tz="UTC")

    assert res1["tasksCompleted"] == res2["tasksCompleted"]
    assert res1["tasksRescheduled"] == res2["tasksRescheduled"]
    assert res1["productivityScore"] == res2["productivityScore"]
