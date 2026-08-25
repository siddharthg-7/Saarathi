import json
import re
import logging
from typing import List, Dict, Any, Tuple, Optional
from app.services.firestore_service import (
    create_task_direct,
    update_task_direct,
    create_goal_direct
)

logger = logging.getLogger(__name__)

def parse_and_execute_tools(uid: str, llm_output: str) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Parses LLM output for tool calls formatted as JSON actions and executes them.
    Returns: (cleaned_message, suggested_actions)
    
    Example LLM Output format:
    ---
    reply: I've created a coding task for you.
    actions:
    [
      {"type": "CREATE_TASK", "parameters": {"title": "Build API", "category": "Coding"}}
    ]
    ---
    OR if the LLM output is a raw JSON string containing reply and actions.
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
    # e.g., actions: [ ... ] or JSON block ```json ... ```
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
                    
            # Remove the json block from reply if it's mixed, unless we got a structured reply from dict
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
            
            # Clean up the reply
            cleaned_reply = llm_output.split("actions:")[0].replace("reply:", "").strip()
            return cleaned_reply, suggested_actions
        except json.JSONDecodeError:
            pass

    # Default: No tool calls detected
    return cleaned_reply, []

def execute_single_action(uid: str, action: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Executes a single parsed tool action against Firestore.
    """
    action_type = action.get("type")
    params = action.get("parameters", {})
    
    logger.info(f"Executing AI action {action_type} for user {uid} with params {params}")
    
    try:
        if action_type == "CREATE_TASK":
            title = params.get("title")
            if not title:
                return None
            task = create_task_direct(
                uid=uid,
                title=title,
                category=params.get("category", "General"),
                energy_required=params.get("energyRequired", "Medium"),
                estimated_duration=params.get("estimatedDuration", 30),
                deadline=params.get("deadline")
            )
            return {
                "actionType": "CREATE_TASK",
                "taskId": task["id"],
                "task": task
            }
            
        elif action_type == "UPDATE_TASK":
            task_id = params.get("taskId")
            if not task_id:
                return None
            
            # Extract valid task fields
            updates = {}
            for field in ["title", "category", "energyRequired", "estimatedDuration", "status", "postponeCount", "deadline"]:
                if field in params:
                    updates[field] = params[field]
            
            success = update_task_direct(uid, task_id, updates)
            if success:
                return {
                    "actionType": "UPDATE_TASK",
                    "taskId": task_id,
                    "updates": updates
                }
                
        elif action_type == "CREATE_GOAL":
            title = params.get("title")
            if not title:
                return None
            goal = create_goal_direct(
                uid=uid,
                title=title,
                description=params.get("description", ""),
                target_date=params.get("targetDate")
            )
            return {
                "actionType": "CREATE_GOAL",
                "goalId": goal["id"],
                "goal": goal
            }
            
        elif action_type == "RESCHEDULE_TASK":
            task_id = params.get("taskId")
            if not task_id:
                return None
            new_date = params.get("newDate")
            new_time = params.get("newTime")
            updates = {}
            if new_time:
                updates["scheduledTime"] = new_time
            if new_date:
                updates["scheduledDate"] = new_date
            if "postponeCount" in params:
                updates["postponeCount"] = params["postponeCount"]
            success = update_task_direct(uid, task_id, updates)
            return {
                "actionType": "RESCHEDULE_TASK",
                "taskId": task_id,
                "updates": updates
            }
                
        elif action_type == "CREATE_MEMORY":
            content = params.get("content")
            if not content:
                return None
            source_type = params.get("sourceType", "user_preference")
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
                
        elif action_type == "START_TASK":
            # START_TASK just instructs the client to run focus mode on a task
            task_id = params.get("taskId")
            if task_id:
                return {
                    "actionType": "START_TASK",
                    "taskId": task_id
                }
                
    except Exception as e:
        logger.error(f"Error executing action {action_type}: {str(e)}")
        
    return None
