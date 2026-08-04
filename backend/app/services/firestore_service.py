import uuid
import logging
from datetime import datetime, timezone
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

logger = logging.getLogger(__name__)

# Initialize firestore client lazily
_db = None

def get_db():
    global _db
    if _db is None:
        _db = firestore.client()
    return _db

def get_user_tasks(uid: str):
    """
    Fetch all tasks for a specific user.
    """
    try:
        db = get_db()
        docs = db.collection('users').document(uid).collection('tasks').stream()
        tasks = []
        for doc in docs:
            t = doc.to_dict()
            t['id'] = doc.id
            tasks.append(t)
        return tasks
    except Exception as e:
        logger.error(f"Error fetching tasks for user {uid}: {str(e)}")
        return []

def get_user_projects(uid: str):
    """
    Fetch all projects for a specific user.
    """
    try:
        db = get_db()
        docs = db.collection('users').document(uid).collection('projects').stream()
        projects = []
        for doc in docs:
            p = doc.to_dict()
            p['id'] = doc.id
            projects.append(p)
        return projects
    except Exception as e:
        logger.error(f"Error fetching projects for user {uid}: {str(e)}")
        return []

def get_user_goals(uid: str):
    """
    Fetch all goals for a specific user.
    """
    try:
        db = get_db()
        docs = db.collection('users').document(uid).collection('goals').stream()
        goals = []
        for doc in docs:
            g = doc.to_dict()
            g['id'] = doc.id
            goals.append(g)
        return goals
    except Exception as e:
        logger.error(f"Error fetching goals for user {uid}: {str(e)}")
        return []

def create_task_direct(
    uid: str,
    title: str,
    category: str = "General",
    energy_required: str = "Medium",
    estimated_duration: int = 30,
    deadline: Optional[str] = None
) -> Dict[str, Any]:
    """
    Directly insert a task into Firestore for a user.
    """
    try:
        db = get_db()
        task_id = str(uuid.uuid4())
        
        now = datetime.now(timezone.utc)
        
        # Parse deadline if provided
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

        db.collection('users').document(uid).collection('tasks').document(task_id).set(task_data)
        logger.info(f"Successfully created task {task_id} for user {uid}")
        
        # Serialize datetimes for response
        task_data["id"] = task_id
        task_data["createdAt"] = now.isoformat()
        task_data["updatedAt"] = now.isoformat()
        if parsed_deadline:
            task_data["deadline"] = parsed_deadline.isoformat()
            
        return task_data
    except Exception as e:
        logger.error(f"Error creating task for user {uid}: {str(e)}")
        raise e

def update_task_direct(uid: str, task_id: str, updates: Dict[str, Any]) -> bool:
    """
    Directly update a task in Firestore.
    """
    try:
        db = get_db()
        ref = db.collection('users').document(uid).collection('tasks').document(task_id)
        
        # Add timestamp & increment version
        updates["updatedAt"] = datetime.now(timezone.utc)
        updates["version"] = firestore.Increment(1)
        
        ref.update(updates)
        return True
    except Exception as e:
        logger.error(f"Error updating task {task_id} for user {uid}: {str(e)}")
        return False

def create_goal_direct(uid: str, title: str, description: str = "", target_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Directly insert a goal into Firestore.
    """
    try:
        db = get_db()
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

        db.collection('users').document(uid).collection('goals').document(goal_id).set(goal_data)
        
        # Serialize
        goal_data["createdAt"] = now.isoformat()
        if parsed_target:
            goal_data["targetDate"] = parsed_target.isoformat()
            
        return goal_data
    except Exception as e:
        logger.error(f"Error creating goal for user {uid}: {str(e)}")
        raise e

def save_chat_message(uid: str, role: str, message: str, context_snapshot: Optional[Dict[str, Any]] = None) -> bool:
    """
    Save a chat message in the user's chat_history Firestore subcollection.
    """
    try:
        db = get_db()
        msg_id = str(uuid.uuid4())
        msg_data = {
            "id": msg_id,
            "role": role,
            "message": message,
            "timestamp": datetime.now(timezone.utc)
        }
        if context_snapshot:
            msg_data["contextSnapshot"] = context_snapshot
            
        db.collection('users').document(uid).collection('chat_history').document(msg_id).set(msg_data)
        return True
    except Exception as e:
        logger.error(f"Error saving chat message for user {uid}: {str(e)}")
        return False

def get_chat_history(uid: str, limit: int = 15):
    """
    Retrieve recent chat history for context memory.
    """
    try:
        db = get_db()
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
            
        # Reverse to get chronological order
        messages.reverse()
        return messages
    except Exception as e:
        logger.error(f"Error fetching chat history for user {uid}: {str(e)}")
        return []

def save_brain_dump_doc(uid: str, transcript: str, task_ids: List[str], audio_url: str = "") -> str:
    """
    Save a record of a processed brain dump.
    """
    try:
        db = get_db()
        bd_id = f"bd_{int(datetime.now(timezone.utc).timestamp())}"
        db.collection('users').document(uid).collection('brain_dumps').document(bd_id).set({
            "id": bd_id,
            "uid": uid,
            "rawTranscript": transcript,
            "audioUrl": audio_url,
            "extractedTaskIds": task_ids,
            "processedAt": datetime.now(timezone.utc)
        })
        return bd_id
    except Exception as e:
        logger.error(f"Error saving brain dump: {e}")
        return f"bd_{uuid.uuid4().hex[:12]}"

