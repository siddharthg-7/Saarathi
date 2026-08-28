import pytest
from unittest.mock import patch, MagicMock
from app.services.prompt_orchestration import orchestrate_chat_prompt
from app.services.tool_calling import parse_and_execute_tools, execute_single_action
from app.services.firestore_service import (
    create_task_direct,
    get_user_tasks,
    delete_task_direct,
    create_reminder_direct,
    snooze_reminder_direct,
    _in_memory_tasks,
    _in_memory_chat,
)

@pytest.fixture(autouse=True)
def clean_in_memory_stores():
    _in_memory_tasks.clear()
    _in_memory_chat.clear()
    yield
    _in_memory_tasks.clear()
    _in_memory_chat.clear()

def test_kairo_prompt_contains_companion_persona_and_actions():
    tasks = [{"id": "t-1", "title": "Build voice loop", "status": "pending"}]
    goals = [{"id": "g-1", "title": "Launch Saarathi MVP"}]
    
    prompt = orchestrate_chat_prompt(
        location="Home Office",
        energy="Medium",
        focus_mode=False,
        goals=goals,
        tasks=tasks,
        memories_context="<retrieved_memory_data>Prefers 25 min Pomodoro</retrieved_memory_data>"
    )
    
    # Assert assistant companion persona
    assert "You are Kairo, the personal AI productivity companion" in prompt
    assert "CONFIRMATION SAFETY" in prompt
    assert "CREATE_TASK" in prompt
    assert "COMPLETE_TASK" in prompt
    assert "DELETE_TASK" in prompt
    assert "CREATE_REMINDER" in prompt
    assert "SNOOZE_REMINDER" in prompt
    assert "RESCHEDULE_TASK" in prompt
    assert "START_TASK" in prompt

def test_kairo_create_and_complete_task_tool():
    uid = "test-user-kairo"
    
    # 1. Test CREATE_TASK
    llm_json_output = """{
        "reply": "I've added the task 'Deep Work on AI Engine' to your list.",
        "actions": [
            {
                "type": "CREATE_TASK",
                "parameters": {
                    "title": "Deep Work on AI Engine",
                    "category": "Coding",
                    "energyRequired": "High",
                    "estimatedDuration": 45
                }
            }
        ]
    }"""
    
    reply, actions = parse_and_execute_tools(uid, llm_json_output)
    assert reply == "I've added the task 'Deep Work on AI Engine' to your list."
    assert len(actions) == 1
    assert actions[0]["actionType"] == "CREATE_TASK"
    task_id = actions[0]["taskId"]
    assert task_id is not None

    user_tasks = get_user_tasks(uid)
    assert any(t["id"] == task_id and t["title"] == "Deep Work on AI Engine" for t in user_tasks)

    # 2. Test COMPLETE_TASK
    llm_complete_output = f"""{{
        "reply": "Great job! Marked that task as complete.",
        "actions": [
            {{
                "type": "COMPLETE_TASK",
                "parameters": {{
                    "taskId": "{task_id}"
                }}
            }}
        ]
    }}"""
    
    reply, complete_actions = parse_and_execute_tools(uid, llm_complete_output)
    assert len(complete_actions) == 1
    assert complete_actions[0]["actionType"] == "COMPLETE_TASK"
    assert complete_actions[0]["status"] == "completed"

    updated_tasks = get_user_tasks(uid)
    completed_task = next(t for t in updated_tasks if t["id"] == task_id)
    assert completed_task["status"] == "completed"

def test_kairo_delete_task_with_confirmation_safeguard():
    uid = "test-user-kairo-del"
    task = create_task_direct(uid, "Old Deprecated Task")
    task_id = task["id"]

    # Delete with requiresConfirmation: True (should not immediately delete)
    action = {
        "type": "DELETE_TASK",
        "parameters": {
            "taskId": task_id,
            "requiresConfirmation": True
        }
    }
    res = execute_single_action(uid, action)
    assert res is not None
    assert res["actionType"] == "DELETE_TASK"
    assert res["requiresConfirmation"] is True
    
    # Verify task still exists because confirmation is required
    tasks_after_confirm_flag = get_user_tasks(uid)
    assert any(t["id"] == task_id for t in tasks_after_confirm_flag)

    # Delete with requiresConfirmation: False (executes deletion directly)
    action_direct = {
        "type": "DELETE_TASK",
        "parameters": {
            "taskId": task_id,
            "requiresConfirmation": False
        }
    }
    res_direct = execute_single_action(uid, action_direct)
    assert res_direct is not None
    assert res_direct["actionType"] == "DELETE_TASK"
    assert res_direct["requiresConfirmation"] is False

    tasks_after_del = get_user_tasks(uid)
    assert not any(t["id"] == task_id for t in tasks_after_del)

def test_kairo_create_and_snooze_reminder():
    uid = "test-user-kairo-rem"
    
    # 1. Create reminder
    action = {
        "type": "CREATE_REMINDER",
        "parameters": {
            "title": "Review System Architecture",
            "scheduledTime": "2026-08-30T10:00:00Z"
        }
    }
    res = execute_single_action(uid, action)
    assert res is not None
    assert res["actionType"] == "CREATE_REMINDER"
    rem_id = res["reminderId"]
    assert rem_id is not None

    # 2. Snooze reminder
    snooze_action = {
        "type": "SNOOZE_REMINDER",
        "parameters": {
            "reminderId": rem_id,
            "snoozeMinutes": 30
        }
    }
    snooze_res = execute_single_action(uid, snooze_action)
    assert snooze_res is not None
    assert snooze_res["actionType"] == "SNOOZE_REMINDER"
    assert snooze_res["snoozeMinutes"] == 30

def test_kairo_unauthorized_cross_user_tool_rejection():
    owner_uid = "user-alice"
    attacker_uid = "user-mallory"
    
    # Alice creates a task
    alice_task = create_task_direct(owner_uid, "Alice Private Notes")
    alice_task_id = alice_task["id"]

    # Mallory attempts to delete Alice's task via Kairo tool call
    malicious_action = {
        "type": "DELETE_TASK",
        "parameters": {
            "taskId": alice_task_id,
            "requiresConfirmation": False
        }
    }
    
    res = execute_single_action(attacker_uid, malicious_action)
    # Must be rejected because Mallory is not the owner
    assert res is None
    
    # Verify Alice's task is still intact
    alice_tasks = get_user_tasks(owner_uid)
    assert any(t["id"] == alice_task_id for t in alice_tasks)
