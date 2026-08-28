import pytest
from app.services.firestore_service import (
    _in_memory_telemetry,
    save_telemetry_batch,
)
from app.services.prompt_orchestration import (
    orchestrate_chat_prompt,
    orchestrate_daily_brief_prompt,
)

@pytest.fixture(autouse=True)
def clean_stores():
    _in_memory_telemetry.clear()
    yield
    _in_memory_telemetry.clear()

def test_telemetry_batch_processing_performance():
    uid = "test-batch-perf-user"
    batch_events = [
        {
            "id": f"batch-evt-{i}",
            "eventType": "task_completed",
            "taskId": f"task-{i}",
            "timestamp": "2026-08-28T05:00:00Z"
        }
        for i in range(75)
    ]

    processed = save_telemetry_batch(uid, batch_events)
    assert processed == 75
    assert len(_in_memory_telemetry.get(uid, [])) == 75

def test_prompt_orchestration_context_clamping():
    # Provide 50 tasks and 20 goals
    large_tasks = [
        {
            "id": f"t-{i}",
            "title": f"Task {i}",
            "status": "pending",
            "energyRequired": "Medium",
            "category": "Work",
            "deadline": "2026-08-30"
        }
        for i in range(50)
    ]
    large_goals = [
        {
            "id": f"g-{i}",
            "title": f"Goal {i}",
            "status": "in_progress"
        }
        for i in range(20)
    ]

    # Large memory context string (5000 chars)
    giant_memory_context = "Preference note: user prefers quiet deep work. " * 100
    assert len(giant_memory_context) > 4000

    prompt = orchestrate_chat_prompt(
        location="Home Office",
        energy="High",
        focus_mode=True,
        goals=large_goals,
        tasks=large_tasks,
        memories_context=giant_memory_context
    )

    # Verify that tasks were clamped to at most 10 in prompt
    assert prompt.count('"id": "t-') <= 10
    # Verify that goals were clamped to at most 5 in prompt
    assert prompt.count('"id": "g-') <= 5
    # Verify total prompt length is kept under reasonable bounds
    assert len(prompt) < 8000
