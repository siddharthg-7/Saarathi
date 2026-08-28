import pytest
from app.services.firestore_service import create_task_direct, get_user_tasks
from app.services.tool_calling import parse_and_execute_tools, execute_single_action

def test_tool_calling_rejects_unowned_task_mutation():
    user_alice = "user_alice_tools"
    user_mallory = "user_mallory_attacker"

    # Alice owns a task
    alice_task = create_task_direct(
        uid=user_alice,
        title="Alice Private Project Task",
        category="Coding",
        energy_required="High",
        estimated_duration=45
    )

    # Mallory attempts to execute tool action on Alice's task
    mallory_action = {
        "type": "UPDATE_TASK",
        "parameters": {
            "taskId": alice_task["id"],
            "title": "Hacked Title",
            "status": "completed"
        }
    }

    result = execute_single_action(uid=user_mallory, action=mallory_action)
    assert result is None # Rejected because Mallory is not the owner!

    # Verify Alice's task is unchanged
    tasks = get_user_tasks(user_alice)
    found_task = next(t for t in tasks if t["id"] == alice_task["id"])
    assert found_task["title"] == "Alice Private Project Task"
    assert found_task["status"] == "pending"

def test_tool_calling_parameter_sanitization_and_bounds():
    user_id = "test_user_tool_params"

    # 1. Reject empty title
    invalid_action = {
        "type": "CREATE_TASK",
        "parameters": {
            "title": "   ",
            "category": "Coding"
        }
    }
    assert execute_single_action(uid=user_id, action=invalid_action) is None

    # 2. Bound duration between 5 and 720 minutes
    oversized_action = {
        "type": "CREATE_TASK",
        "parameters": {
            "title": "Extreme Duration Task",
            "estimatedDuration": 999999
        }
    }
    res = execute_single_action(uid=user_id, action=oversized_action)
    assert res is not None
    assert res["task"]["estimatedDuration"] == 720 # Clamped to max allowed duration
