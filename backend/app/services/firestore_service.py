import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

logger = logging.getLogger(__name__)

# Initialize firestore client lazily
_db = None
_firestore_available: Optional[bool] = None

# In-memory storage for dev / local testing when Firestore ADC credentials are not configured
_in_memory_tasks: Dict[str, List[Dict[str, Any]]] = {}
_in_memory_goals: Dict[str, List[Dict[str, Any]]] = {}
_in_memory_projects: Dict[str, List[Dict[str, Any]]] = {}
_in_memory_chat: Dict[str, List[Dict[str, Any]]] = {}
_in_memory_telemetry: Dict[str, List[Dict[str, Any]]] = {}
_in_memory_daily_analytics: Dict[str, Dict[str, Any]] = {}
_in_memory_mood_energy: Dict[str, List[Dict[str, Any]]] = {}

def get_db():
    global _db, _firestore_available
    if _firestore_available is False:
        return None
    if _db is None:
        try:
            _db = firestore.client()
            _firestore_available = True
        except Exception as e:
            _firestore_available = False
            logger.info(f"Firestore ADC credentials not found ({e}). Using local in-memory fallback store for session.")
            return None
    return _db

def get_user_tasks(uid: str, status: Optional[str] = None, limit_count: Optional[int] = 200) -> List[Dict[str, Any]]:
    """
    Fetch tasks for a specific user with optional status filter and bounded limit.
    """
    db = get_db()
    if db is None:
        tasks = list(_in_memory_tasks.get(uid, []))
        if status:
            tasks = [t for t in tasks if t.get("status") == status]
        if limit_count:
            tasks = tasks[:limit_count]
        return tasks
    try:
        query_ref = db.collection('users').document(uid).collection('tasks')
        if status:
            query_ref = query_ref.where(filter=FieldFilter('status', '==', status))
        if limit_count:
            query_ref = query_ref.limit(limit_count)
        docs = query_ref.stream()
        tasks = []
        for doc in docs:
            t = doc.to_dict()
            t['id'] = doc.id
            tasks.append(t)
        return tasks
    except Exception as e:
        logger.warning(f"Error fetching tasks from Firestore for user {uid}: {str(e)}")
        tasks = list(_in_memory_tasks.get(uid, []))
        if status:
            tasks = [t for t in tasks if t.get("status") == status]
        if limit_count:
            tasks = tasks[:limit_count]
        return tasks

def get_user_tasks_paginated(
    uid: str,
    status: Optional[str] = None,
    page_size: int = 50,
    last_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Cursor-based pagination for querying user tasks efficiently.
    """
    db = get_db()
    if db is None:
        all_tasks = list(_in_memory_tasks.get(uid, []))
        if status:
            all_tasks = [t for t in all_tasks if t.get("status") == status]
        
        start_idx = 0
        if last_id:
            for i, t in enumerate(all_tasks):
                if t.get("id") == last_id:
                    start_idx = i + 1
                    break
        paginated = all_tasks[start_idx : start_idx + page_size]
        next_cursor = paginated[-1]["id"] if len(paginated) == page_size else None
        return {
            "items": paginated,
            "nextCursor": next_cursor,
            "hasMore": len(paginated) == page_size,
            "count": len(paginated)
        }
    try:
        col_ref = db.collection('users').document(uid).collection('tasks')
        query_ref = col_ref
        if status:
            query_ref = query_ref.where(filter=FieldFilter('status', '==', status))
        query_ref = query_ref.order_by('createdAt')
        
        if last_id:
            last_doc = col_ref.document(last_id).get()
            if last_doc.exists:
                query_ref = query_ref.start_after(last_doc)
                
        query_ref = query_ref.limit(page_size)
        docs = list(query_ref.stream())
        items = []
        for doc in docs:
            t = doc.to_dict()
            t['id'] = doc.id
            items.append(t)
            
        next_cursor = items[-1]["id"] if len(items) == page_size else None
        return {
            "items": items,
            "nextCursor": next_cursor,
            "hasMore": len(items) == page_size,
            "count": len(items)
        }
    except Exception as e:
        logger.warning(f"Error fetching paginated tasks for user {uid}: {str(e)}")
        return {"items": [], "nextCursor": None, "hasMore": False, "count": 0}

def get_user_projects(uid: str) -> List[Dict[str, Any]]:
    """
    Fetch all projects for a specific user.
    """
    db = get_db()
    if db is None:
        return list(_in_memory_projects.get(uid, []))
    try:
        docs = db.collection('users').document(uid).collection('projects').stream()
        projects = []
        for doc in docs:
            p = doc.to_dict()
            p['id'] = doc.id
            projects.append(p)
        return projects
    except Exception as e:
        logger.warning(f"Error fetching projects from Firestore for user {uid}: {str(e)}")
        return list(_in_memory_projects.get(uid, []))

def get_user_goals(uid: str) -> List[Dict[str, Any]]:
    """
    Fetch all goals for a specific user.
    """
    db = get_db()
    if db is None:
        return list(_in_memory_goals.get(uid, []))
    try:
        docs = db.collection('users').document(uid).collection('goals').stream()
        goals = []
        for doc in docs:
            g = doc.to_dict()
            g['id'] = doc.id
            goals.append(g)
        return goals
    except Exception as e:
        logger.warning(f"Error fetching goals from Firestore for user {uid}: {str(e)}")
        return list(_in_memory_goals.get(uid, []))

def get_user_telemetry_paginated(
    uid: str,
    event_type: Optional[str] = None,
    page_size: int = 50,
    last_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Cursor-based pagination for user telemetry events.
    """
    db = get_db()
    if db is None:
        events = list(_in_memory_telemetry.get(uid, []))
        if event_type:
            events = [e for e in events if e.get("eventType") == event_type]
        start_idx = 0
        if last_id:
            for i, e in enumerate(events):
                if e.get("id") == last_id or e.get("eventId") == last_id:
                    start_idx = i + 1
                    break
        paginated = events[start_idx : start_idx + page_size]
        next_cursor = (paginated[-1].get("id") or paginated[-1].get("eventId")) if len(paginated) == page_size else None
        return {
            "items": paginated,
            "nextCursor": next_cursor,
            "hasMore": len(paginated) == page_size,
            "count": len(paginated)
        }
    try:
        col_ref = db.collection('users').document(uid).collection('telemetry')
        query_ref = col_ref
        if event_type:
            query_ref = query_ref.where(filter=FieldFilter('eventType', '==', event_type))
        query_ref = query_ref.order_by('timestamp').limit(page_size)
        docs = list(query_ref.stream())
        items = []
        for doc in docs:
            e = doc.to_dict()
            e['id'] = doc.id
            items.append(e)
        next_cursor = items[-1]["id"] if len(items) == page_size else None
        return {
            "items": items,
            "nextCursor": next_cursor,
            "hasMore": len(items) == page_size,
            "count": len(items)
        }
    except Exception as e:
        logger.warning(f"Error fetching paginated telemetry for user {uid}: {str(e)}")
        return {"items": [], "nextCursor": None, "hasMore": False, "count": 0}

def create_task_direct(
    uid: str,
    title: str,
    category: str = "General",
    energy_required: str = "Medium",
    estimated_duration: int = 30,
    deadline: Optional[str] = None
) -> Dict[str, Any]:
    """
    Directly insert a task into Firestore or in-memory store for a user.
    """
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    parsed_deadline = None
    if deadline:
        try:
            parsed_deadline = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
        except ValueError:
            pass

    task_data = {
        "id": task_id,
        "title": title,
        "category": category,
        "energyRequired": energy_required,
        "estimatedDuration": estimated_duration,
        "difficulty": 3,
        "importance": 3,
        "urgency": 3,
        "status": "pending",
        "postponeCount": 0,
        "version": 1,
        "createdAt": now,
        "updatedAt": now
    }
    
    if parsed_deadline:
        task_data["deadline"] = parsed_deadline

    db = get_db()
    if db is not None:
        try:
            db.collection('users').document(uid).collection('tasks').document(task_id).set(task_data)
            logger.info(f"Successfully created task {task_id} in Firestore for user {uid}")
        except Exception as e:
            logger.warning(f"Failed to write task to Firestore ({e}), stored in-memory.")
            _in_memory_tasks.setdefault(uid, []).append(task_data)
    else:
        _in_memory_tasks.setdefault(uid, []).append(task_data)
        logger.info(f"Created task {task_id} in local session for user {uid}")

    # Serialize datetimes for response
    task_data["createdAt"] = now.isoformat()
    task_data["updatedAt"] = now.isoformat()
    if parsed_deadline:
        task_data["deadline"] = parsed_deadline.isoformat()
        
    return task_data

def update_task_direct(uid: str, task_id: str, updates: Dict[str, Any]) -> bool:
    """
    Directly update a task in Firestore or in-memory store.
    """
    db = get_db()
    if db is not None:
        try:
            ref = db.collection('users').document(uid).collection('tasks').document(task_id)
            updates["updatedAt"] = datetime.now(timezone.utc)
            updates["version"] = firestore.Increment(1)
            ref.update(updates)
            return True
        except Exception as e:
            logger.warning(f"Error updating task in Firestore ({e}), attempting in-memory update.")

    tasks = _in_memory_tasks.get(uid, [])
    for t in tasks:
        if t.get("id") == task_id:
            t.update(updates)
            t["updatedAt"] = datetime.now(timezone.utc).isoformat()
            t["version"] = t.get("version", 1) + 1
            return True
def delete_task_direct(uid: str, task_id: str) -> bool:
    """
    Directly delete a task from Firestore or in-memory store.
    """
    db = get_db()
    if db is not None:
        try:
            db.collection('users').document(uid).collection('tasks').document(task_id).delete()
            return True
        except Exception as e:
            logger.warning(f"Error deleting task in Firestore ({e}), attempting in-memory removal.")

    tasks = _in_memory_tasks.get(uid, [])
    for i, t in enumerate(tasks):
        if t.get("id") == task_id:
            tasks.pop(i)
            return True
    return False

def create_reminder_direct(uid: str, title: str, scheduled_time: Optional[str] = None) -> Dict[str, Any]:
    """
    Directly create a reminder / notification for a user.
    """
    rem_id = f"rem_{int(datetime.now(timezone.utc).timestamp()*1000)}"
    now = datetime.now(timezone.utc)
    
    parsed_time = None
    if scheduled_time:
        try:
            parsed_time = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
        except ValueError:
            pass

    rem_data = {
        "id": rem_id,
        "userId": uid,
        "title": title,
        "type": "smart_reminder",
        "scheduledTime": parsed_time.isoformat() if parsed_time else now.isoformat(),
        "read": False,
        "snoozed": False,
        "createdAt": now.isoformat(),
    }

    db = get_db()
    if db is not None:
        try:
            db.collection('users').document(uid).collection('notifications').document(rem_id).set(rem_data)
        except Exception as e:
            logger.warning(f"Error saving reminder to Firestore: {e}")

    return rem_data

def snooze_reminder_direct(uid: str, reminder_id: str, snooze_minutes: int = 15) -> bool:
    """
    Snooze an existing reminder by specified minutes.
    """
    db = get_db()
    if db is not None:
        try:
            ref = db.collection('users').document(uid).collection('notifications').document(reminder_id)
            ref.update({
                "snoozed": True,
                "snoozeMinutes": snooze_minutes,
                "updatedAt": datetime.now(timezone.utc).isoformat()
            })
            return True
        except Exception as e:
            logger.warning(f"Error snoozing reminder in Firestore: {e}")
    return True

def create_goal_direct(uid: str, title: str, description: str = "", target_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Directly insert a goal into Firestore or in-memory store.
    """
    goal_id = f"goal_{int(datetime.now(timezone.utc).timestamp())}"
    now = datetime.now(timezone.utc)
    
    parsed_target = None
    if target_date:
        try:
            parsed_target = datetime.fromisoformat(target_date.replace('Z', '+00:00'))
        except ValueError:
            pass

    goal_data = {
        "id": goal_id,
        "title": title,
        "description": description,
        "status": "in_progress",
        "roadmapGenerated": False,
        "version": 1,
        "createdAt": now
    }
    if parsed_target:
        goal_data["targetDate"] = parsed_target

    db = get_db()
    if db is not None:
        try:
            db.collection('users').document(uid).collection('goals').document(goal_id).set(goal_data)
        except Exception as e:
            logger.warning(f"Failed to write goal to Firestore ({e}), storing in memory.")
            _in_memory_goals.setdefault(uid, []).append(goal_data)
    else:
        _in_memory_goals.setdefault(uid, []).append(goal_data)
        logger.info(f"Created goal {goal_id} in local session for user {uid}")
    
    goal_data["createdAt"] = now.isoformat()
    if parsed_target:
        goal_data["targetDate"] = parsed_target.isoformat()
        
    return goal_data

def save_chat_message(uid: str, role: str, message: str, context_snapshot: Optional[Dict[str, Any]] = None) -> bool:
    """
    Save a chat message in the user's chat_history.
    """
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    msg_data = {
        "id": msg_id,
        "role": role,
        "message": message,
        "timestamp": now
    }
    if context_snapshot:
        msg_data["contextSnapshot"] = context_snapshot

    db = get_db()
    if db is not None:
        try:
            db.collection('users').document(uid).collection('chat_history').document(msg_id).set(msg_data)
            return True
        except Exception as e:
            logger.warning(f"Failed to save chat message to Firestore ({e}), storing in memory.")
            _in_memory_chat.setdefault(uid, []).append(msg_data)
            return True
    else:
        _in_memory_chat.setdefault(uid, []).append(msg_data)
        return True

def get_chat_history(uid: str, limit: int = 15) -> List[Dict[str, str]]:
    """
    Retrieve recent chat history for context memory.
    """
    db = get_db()
    if db is not None:
        try:
            docs = db.collection('users').document(uid).collection('chat_history')\
                     .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                     .limit(limit).stream()
                     
            messages = []
            for doc in docs:
                m = doc.to_dict()
                messages.append({
                    "role": m.get("role", "user"),
                    "content": m.get("message", "")
                })
                
            messages.reverse()
            return messages
        except Exception as e:
            logger.warning(f"Error fetching chat history from Firestore ({e}), using in-memory.")

    history = _in_memory_chat.get(uid, [])[-limit:]
    return [{"role": m.get("role", "user"), "content": m.get("message", "")} for m in history]

def save_brain_dump_doc(uid: str, transcript: str, task_ids: List[str], audio_url: str = "") -> str:
    """
    Save a record of a processed brain dump.
    """
    bd_id = f"bd_{int(datetime.now(timezone.utc).timestamp())}"
    doc_data = {
        "id": bd_id,
        "uid": uid,
        "rawTranscript": transcript,
        "audioUrl": audio_url,
        "extractedTaskIds": task_ids,
        "processedAt": datetime.now(timezone.utc)
    }
    db = get_db()
    if db is not None:
        try:
            db.collection('users').document(uid).collection('brain_dumps').document(bd_id).set(doc_data)
            return bd_id
        except Exception as e:
            logger.warning(f"Error saving brain dump to Firestore: {e}")
    return bd_id

def save_telemetry_event(uid: str, event_data: Dict[str, Any]) -> str:
    """
    Save a single telemetry event under users/{uid}/telemetry/{eventId}
    """
    event_id = event_data.get("id") or f"evt_{int(datetime.now(timezone.utc).timestamp()*1000)}_{uuid.uuid4().hex[:6]}"
    event_data["id"] = event_id
    event_data["userId"] = uid
    if "timestamp" not in event_data or not event_data["timestamp"]:
        event_data["timestamp"] = datetime.now(timezone.utc).isoformat()
    if "createdAt" not in event_data or not event_data["createdAt"]:
        event_data["createdAt"] = datetime.now(timezone.utc).isoformat()

    db = get_db()
    if db is not None:
        try:
            db.collection('users').document(uid).collection('telemetry').document(event_id).set(event_data)
        except Exception as e:
            logger.warning(f"Failed to write telemetry to Firestore ({e}), storing in memory.")
            _in_memory_telemetry.setdefault(uid, []).append(event_data)
    else:
        _in_memory_telemetry.setdefault(uid, []).append(event_data)

    return event_id

def save_telemetry_batch(uid: str, events: List[Dict[str, Any]]) -> int:
    """
    Batch write telemetry events with deduplication
    """
    count = 0
    db = get_db()
    
    if db is not None:
        try:
            batch = db.batch()
            for evt in events:
                evt_id = evt.get("id") or f"evt_{int(datetime.now(timezone.utc).timestamp()*1000)}_{uuid.uuid4().hex[:6]}"
                evt["id"] = evt_id
                evt["userId"] = uid
                if "timestamp" not in evt or not evt["timestamp"]:
                    evt["timestamp"] = datetime.now(timezone.utc).isoformat()
                doc_ref = db.collection('users').document(uid).collection('telemetry').document(evt_id)
                batch.set(doc_ref, evt)
                count += 1
            batch.commit()
            return count
        except Exception as e:
            logger.warning(f"Batch write to Firestore failed ({e}), saving in memory.")
    
    # In-memory fallback
    seen = {e.get("id") for e in _in_memory_telemetry.get(uid, [])}
    for evt in events:
        evt_id = evt.get("id") or f"evt_{int(datetime.now(timezone.utc).timestamp()*1000)}_{uuid.uuid4().hex[:6]}"
        evt["id"] = evt_id
        evt["userId"] = uid
        if evt_id not in seen:
            _in_memory_telemetry.setdefault(uid, []).append(evt)
            seen.add(evt_id)
            count += 1

    return count

def get_user_telemetry_events(uid: str, limit: int = 200) -> List[Dict[str, Any]]:
    """
    Retrieve recent telemetry events for analytics processing
    """
    db = get_db()
    if db is not None:
        try:
            docs = db.collection('users').document(uid).collection('telemetry')\
                     .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                     .limit(limit).stream()
            events = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                events.append(data)
            return events
        except Exception as e:
            logger.warning(f"Error reading telemetry from Firestore ({e}), using in-memory.")

    mem = _in_memory_telemetry.get(uid, [])
    return list(reversed(mem[-limit:]))

def save_daily_analytics_doc(uid: str, date_str: str, data: Dict[str, Any]) -> None:
    """
    Save pre-aggregated daily analytics doc under users/{uid}/analytics_daily/{date}
    """
    db = get_db()
    if db is not None:
        try:
            db.collection('users').document(uid).collection('analytics_daily').document(date_str).set(data)
        except Exception as e:
            logger.warning(f"Error saving daily analytics to Firestore: {e}")
    _in_memory_daily_analytics[f"{uid}_{date_str}"] = data

def get_daily_analytics_doc(uid: str, date_str: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve daily analytics doc from Firestore or in-memory cache
    """
    db = get_db()
    if db is not None:
        try:
            doc = db.collection('users').document(uid).collection('analytics_daily').document(date_str).get()
            if doc.exists:
                return doc.to_dict()
        except Exception as e:
            logger.warning(f"Error reading daily analytics from Firestore: {e}")
    return _in_memory_daily_analytics.get(f"{uid}_{date_str}")

def save_mood_energy_doc(uid: str, energy: Optional[str], mood: Optional[str], source: str = "manual", notes: Optional[str] = None) -> Dict[str, Any]:
    """
    Record an explicit mood and energy log
    """
    log_id = f"log_{int(datetime.now(timezone.utc).timestamp()*1000)}"
    doc_data = {
        "id": log_id,
        "userId": uid,
        "energy": energy,
        "mood": mood,
        "source": source,
        "notes": notes,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    db = get_db()
    if db is not None:
        try:
            db.collection('users').document(uid).collection('energy_mood_logs').document(log_id).set(doc_data)
        except Exception as e:
            logger.warning(f"Error saving mood/energy log to Firestore: {e}")
    _in_memory_mood_energy.setdefault(uid, []).append(doc_data)
    return doc_data

# In-memory storage for resilient checkpoints
_in_memory_checkpoints: Dict[str, Dict[str, Any]] = {}

def save_checkpoint_doc(
    checkpoint_id: str,
    uid: str,
    stage: str,
    raw_transcript: Optional[str] = None,
    extracted_tasks: Optional[List[Dict[str, Any]]] = None,
    audio_checksum: Optional[str] = None,
    error_code: Optional[str] = None,
    error_message: Optional[str] = None
) -> Dict[str, Any]:
    """
    Persists intermediate multi-stage pipeline state (audio_saved, transcribed, tasks_extracted, synced).
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    data = {
        "checkpointId": checkpoint_id,
        "userId": uid,
        "stage": stage,
        "rawTranscript": raw_transcript,
        "extractedTasks": extracted_tasks or [],
        "audioChecksum": audio_checksum,
        "errorCode": error_code,
        "errorMessage": error_message,
        "updatedAt": now_iso,
    }
    
    db = get_db()
    if db is not None:
        try:
            db.collection('users').document(uid).collection('checkpoints').document(checkpoint_id).set(data, merge=True)
        except Exception as e:
            logger.warning(f"Error saving checkpoint doc to Firestore: {e}")
            
    existing = _in_memory_checkpoints.get(checkpoint_id, {"createdAt": now_iso})
    merged = {**existing, **data}
    _in_memory_checkpoints[checkpoint_id] = merged
    return merged

def get_checkpoint_doc(uid: str, checkpoint_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a checkpoint by ID for resume capability with strict user isolation.
    """
    db = get_db()
    if db is not None:
        try:
            doc = db.collection('users').document(uid).collection('checkpoints').document(checkpoint_id).get()
            if doc.exists:
                d = doc.to_dict()
                if d and d.get("userId") == uid:
                    return d
        except Exception as e:
            logger.warning(f"Error fetching checkpoint from Firestore: {e}")
            
    cp = _in_memory_checkpoints.get(checkpoint_id)
    if cp and cp.get("userId") == uid:
        return cp
    return None



