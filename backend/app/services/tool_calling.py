import json
import re
import logging
from typing import List, Dict, Any, Tuple, Optional
from app.services.firestore_service import (
    create_task_direct,
    update_task_direct,
    delete_task_direct,
    create_reminder_direct,
    snooze_reminder_direct,
    create_goal_direct,
    get_user_tasks,
)

logger = logging.getLogger(__name__)

ALLOWED_CATEGORIES = {"General", "Coding", "Fitness", "Study", "Work", "Personal", "Health", "Finance", "Admin"}
ALLOWED_ENERGY = {"Low", "Medium", "High"}
ALLOWED_STATUS = {"pending", "in_progress", "completed", "skipped"}
ALLOWED_MEMORY_SOURCES = {"user_preference", "note", "brain_dump", "kairo_chat", "goal", "task"}

def parse_and_execute_tools(uid: str, llm_output: str) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Parses LLM output for tool calls formatted as JSON actions and executes them
    with strict server-side authorization and parameter validation.
    """
    suggested_actions = []
    cleaned_reply = llm_output
    
    # Try parsing as full JSON first (structured output)
    try:
        data = json.loads(llm_output.strip())
        if isinstance(data, dict) and "reply" in data:
            cleaned_reply = data["reply"]
            actions = data.get("actions", [])
            for action in actions:
                resolved_action = execute_single_action(uid, action)
                if resolved_action:
                    suggested_actions.append(resolved_action)
            return cleaned_reply, suggested_actions
    except json.JSONDecodeError:
        pass

    # Extract JSON actions list via regex if it's mixed with free text
    json_block_match = re.search(r'```json\s*(.*?)\s*```', llm_output, re.DOTALL)
    if json_block_match:
        try:
            data = json.loads(json_block_match.group(1).strip())
            if isinstance(data, dict):
                cleaned_reply = data.get("reply", cleaned_reply)
                actions = data.get("actions", [])
            elif isinstance(data, list):
                actions = data
            else:
                actions = []
                
            for action in actions:
                resolved_action = execute_single_action(uid, action)
                if resolved_action:
                    suggested_actions.append(resolved_action)
                    
            if isinstance(data, dict) and "reply" in data:
                cleaned_reply = data["reply"]
            else:
                cleaned_reply = re.sub(r'```json.*?```', '', llm_output, flags=re.DOTALL).strip()
            return cleaned_reply, suggested_actions
        except json.JSONDecodeError:
            pass

    # Basic fallback pattern matching for actions: [...]
    actions_match = re.search(r'actions:\s*(\[.*?\])', llm_output, re.DOTALL)
    if actions_match:
        try:
            actions = json.loads(actions_match.group(1).strip())
            for action in actions:
                resolved_action = execute_single_action(uid, action)
                if resolved_action:
                    suggested_actions.append(resolved_action)
            
            cleaned_reply = llm_output.split("actions:")[0].replace("reply:", "").strip()
            return cleaned_reply, suggested_actions
        except json.JSONDecodeError:
            pass

    return cleaned_reply, []

def execute_single_action(uid: str, action: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Executes a single parsed tool action against Firestore after strict parameter validation
    and backend ownership verification.
    """
    if not isinstance(action, dict):
        return None

    action_type = action.get("type")
    params = action.get("parameters", {})
    if not isinstance(params, dict):
        return None
    
    logger.info(f"Executing AI action {action_type} for user {uid}")
    
    try:
        if action_type == "CREATE_TASK":
            title = str(params.get("title", "")).strip()
            if not title or len(title) > 200:
                logger.warning(f"CREATE_TASK rejected: invalid title length ({len(title)})")
                return None
            
            category = params.get("category", "General")
            if category not in ALLOWED_CATEGORIES:
                category = "General"

            energy = params.get("energyRequired", "Medium")
            if energy not in ALLOWED_ENERGY:
                energy = "Medium"

            try:
                duration = int(params.get("estimatedDuration", 30))
                duration = max(5, min(720, duration))
            except (ValueError, TypeError):
                duration = 30

            task = create_task_direct(
                uid=uid,
                title=title,
                category=category,
                energy_required=energy,
                estimated_duration=duration,
                deadline=params.get("deadline")
            )
            return {
                "actionType": "CREATE_TASK",
                "taskId": task["id"],
                "task": task
            }
            
        elif action_type == "UPDATE_TASK":
            task_id = str(params.get("taskId", "")).strip()
            if not task_id:
                return None
            
            # Authorization check: verify task belongs to authenticated user
            user_tasks = get_user_tasks(uid)
            task_exists = any(t.get("id") == task_id for t in user_tasks)
            if not task_exists:
                logger.warning(f"UPDATE_TASK rejected: user {uid} does not own task {task_id}")
                return None
            
            # Extract and validate task fields
            updates = {}
            if "title" in params:
                clean_title = str(params["title"]).strip()
                if clean_title and len(clean_title) <= 200:
                    updates["title"] = clean_title
            if "category" in params and params["category"] in ALLOWED_CATEGORIES:
                updates["category"] = params["category"]
            if "energyRequired" in params and params["energyRequired"] in ALLOWED_ENERGY:
                updates["energyRequired"] = params["energyRequired"]
            if "status" in params and params["status"] in ALLOWED_STATUS:
                updates["status"] = params["status"]
            if "postponeCount" in params:
                try:
                    updates["postponeCount"] = max(0, int(params["postponeCount"]))
                except (ValueError, TypeError):
                    pass
            if "deadline" in params:
                updates["deadline"] = params["deadline"]
            
            if not updates:
                return None

            success = update_task_direct(uid, task_id, updates)
            if success:
                return {
                    "actionType": "UPDATE_TASK",
                    "taskId": task_id,
                    "updates": updates
                }
                
        elif action_type == "COMPLETE_TASK":
            task_id = str(params.get("taskId", "")).strip()
            if not task_id:
                return None
            user_tasks = get_user_tasks(uid)
            task_exists = any(t.get("id") == task_id for t in user_tasks)
            if not task_exists:
                logger.warning(f"COMPLETE_TASK rejected: user {uid} does not own task {task_id}")
                return None

            success = update_task_direct(uid, task_id, {"status": "completed"})
            if success:
                return {
                    "actionType": "COMPLETE_TASK",
                    "taskId": task_id,
                    "status": "completed"
                }

        elif action_type == "DELETE_TASK":
            task_id = str(params.get("taskId", "")).strip()
            requires_confirmation = params.get("requiresConfirmation", False)
            if not task_id:
                return None
            user_tasks = get_user_tasks(uid)
            task_exists = any(t.get("id") == task_id for t in user_tasks)
            if not task_exists:
                logger.warning(f"DELETE_TASK rejected: user {uid} does not own task {task_id}")
                return None

            if not requires_confirmation:
                delete_task_direct(uid, task_id)
            return {
                "actionType": "DELETE_TASK",
                "taskId": task_id,
                "requiresConfirmation": requires_confirmation
            }

        elif action_type == "CREATE_REMINDER":
            title = str(params.get("title", "")).strip()
            if not title:
                return None
            rem = create_reminder_direct(uid, title, params.get("scheduledTime"))
            return {
                "actionType": "CREATE_REMINDER",
                "reminderId": rem.get("id"),
                "reminder": rem
            }

        elif action_type == "SNOOZE_REMINDER":
            reminder_id = str(params.get("reminderId", "")).strip()
            snooze_min = int(params.get("snoozeMinutes", 15))
            if not reminder_id:
                return None
            snooze_reminder_direct(uid, reminder_id, snooze_min)
            return {
                "actionType": "SNOOZE_REMINDER",
                "reminderId": reminder_id,
                "snoozeMinutes": snooze_min
            }

        elif action_type == "CREATE_GOAL":
            title = str(params.get("title", "")).strip()
            if not title or len(title) > 200:
                return None
            description = str(params.get("description", ""))[:500]
            goal = create_goal_direct(
                uid=uid,
                title=title,
                description=description,
                target_date=params.get("targetDate")
            )
            return {
                "actionType": "CREATE_GOAL",
                "goalId": goal["id"],
                "goal": goal
            }
            
        elif action_type == "RESCHEDULE_TASK":
            task_id = str(params.get("taskId", "")).strip()
            if not task_id:
                return None
            
            # Authorization check: verify task belongs to authenticated user
            user_tasks = get_user_tasks(uid)
            task_exists = any(t.get("id") == task_id for t in user_tasks)
            if not task_exists:
                logger.warning(f"RESCHEDULE_TASK rejected: user {uid} does not own task {task_id}")
                return None

            new_date = params.get("newDate")
            new_time = params.get("newTime")
            updates = {}
            if new_time:
                updates["scheduledTime"] = str(new_time)[:16]
            if new_date:
                updates["scheduledDate"] = str(new_date)[:16]
            if "postponeCount" in params:
                try:
                    updates["postponeCount"] = max(0, int(params["postponeCount"]))
                except (ValueError, TypeError):
                    pass

            if not updates:
                return None

            success = update_task_direct(uid, task_id, updates)
            return {
                "actionType": "RESCHEDULE_TASK",
                "taskId": task_id,
                "updates": updates
            }
                
        elif action_type == "CREATE_MEMORY":
            content = str(params.get("content", "")).strip()
            if not content or len(content) > 2000:
                return None
            source_type = params.get("sourceType", "user_preference")
            if source_type not in ALLOWED_MEMORY_SOURCES:
                source_type = "user_preference"

            from app.services.memory.memory_service import MemoryService
            from app.models import MemoryCreateRequest
            mem = MemoryService.index_memory(
                uid=uid,
                req=MemoryCreateRequest(
                    sourceType=source_type,
                    content=content,
                    importance=0.8
                )
            )
            return {
                "actionType": "CREATE_MEMORY",
                "memoryId": mem.id,
                "content": mem.content
            }
                
        elif action_type in ["START_TASK", "START_FOCUS"]:
            task_id = str(params.get("taskId", "")).strip()
            if task_id:
                user_tasks = get_user_tasks(uid)
                if any(t.get("id") == task_id for t in user_tasks):
                    return {
                        "actionType": "START_TASK",
                        "taskId": task_id
                    }
            return {
                "actionType": "START_TASK",
                "taskId": task_id or "focus_general"
            }
                
    except Exception as e:
        logger.error(f"Error executing action {action_type}: {str(e)}")
        
    return None

