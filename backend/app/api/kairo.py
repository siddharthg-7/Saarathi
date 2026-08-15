import re
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from app.core.security import verify_firebase_token
from app.services.firestore_service import (
    get_user_tasks,
    get_user_goals,
    get_chat_history,
    save_chat_message
)
from app.services.prompt_orchestration import orchestrate_chat_prompt, orchestrate_daily_brief_prompt
from app.services.ai_service import call_groq_chat, call_gemini
from app.services.tool_calling import parse_and_execute_tools

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/kairo", tags=["Kairo AI Assistant"])

class ClientContext(BaseModel):
    currentLocation: Optional[str] = "Unknown"
    currentEnergy: Optional[str] = "Medium"
    activeFocusMode: Optional[bool] = False

class ChatRequest(BaseModel):
    message: str
    clientContext: Optional[ClientContext] = None

class SuggestedAction(BaseModel):
    actionType: str
    taskId: Optional[str] = None
    goalId: Optional[str] = None
    task: Optional[Dict[str, Any]] = None
    goal: Optional[Dict[str, Any]] = None
    updates: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    role: str = "assistant"
    message: str = ""
    suggestedActions: List[SuggestedAction] = []
    timestamp: str = ""
    
    # Backward compatibility fields
    reply: str = ""
    suggestedAction: str = ""

class DailyBriefResponse(BaseModel):
    greeting: str
    optimalFocusWindow: Dict[str, str]
    insights: str
    scheduleSummary: List[Dict[str, str]]

@router.websocket("/chat/ws")
async def chat_ws(websocket: WebSocket, token: Optional[str] = Query(None)):
    await websocket.accept()
    
    auth_token = token or websocket.query_params.get("token")
    try:
        from app.core.security import decode_token_payload
        payload = decode_token_payload(auth_token) if auth_token else {}
        uid = payload.get("uid") or payload.get("user_id") or payload.get("sub") or "dev-user-uid"
    except Exception as e:
        logger.warning(f"WebSocket auth fallback: {e}")
        uid = "dev-user-uid"

    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            message = data.get("message", "")
            client_context = data.get("clientContext", {}) or {}
            
            location = client_context.get("currentLocation", "Unknown")
            energy = client_context.get("currentEnergy", "Medium")
            focus_mode = client_context.get("activeFocusMode", False)
            
            tasks = get_user_tasks(uid)
            goals = get_user_goals(uid)
            history = get_chat_history(uid, limit=10)
            
            system_prompt = orchestrate_chat_prompt(
                location=location,
                energy=energy,
                focus_mode=focus_mode,
                goals=goals,
                tasks=tasks
            )
            
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": message})
            
            full_response = ""
            try:
                from app.services.ai_service import call_groq_chat_stream
                async for chunk in call_groq_chat_stream(messages):
                    full_response += chunk
                    await websocket.send_json({
                        "type": "content",
                        "delta": chunk
                    })
            except Exception as e:
                logger.warning(f"Groq streaming failed, falling back to Gemini: {e}")
                gemini_contents = []
                for msg in messages:
                    if msg["role"] != "system":
                        gemini_contents.append({
                            "role": "model" if msg["role"] == "assistant" else "user",
                            "parts": [{"text": msg["content"]}]
                        })
                response_text = await call_gemini(gemini_contents, system_instruction=system_prompt)
                full_response = response_text
                await websocket.send_json({
                    "type": "content",
                    "delta": response_text
                })
            
            cleaned_reply, executed_actions = parse_and_execute_tools(uid, full_response)
            
            actions = []
            for act in executed_actions:
                actions.append({
                    "actionType": act.get("actionType", ""),
                    "taskId": act.get("taskId"),
                    "goalId": act.get("goalId"),
                    "task": act.get("task"),
                    "goal": act.get("goal"),
                    "updates": act.get("updates"),
                    "label": act.get("actionType", "").replace('_', ' ')
                })
            
            save_chat_message(uid, "user", message)
            save_chat_message(uid, "assistant", cleaned_reply, context_snapshot={
                "location": location,
                "energy": energy,
                "focusMode": focus_mode
            })
            
            timestamp = datetime.now(timezone.utc).isoformat()
            await websocket.send_json({
                "type": "done",
                "message": cleaned_reply,
                "suggestedActions": actions,
                "timestamp": timestamp
            })
            
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass

@router.post("/chat", response_model=ChatResponse)
async def chat_with_kairo(payload: ChatRequest, uid: str = Depends(verify_firebase_token)):
    # 1. Fetch user context & database info
    tasks = get_user_tasks(uid)
    goals = get_user_goals(uid)
    
    location = payload.clientContext.currentLocation if payload.clientContext else "Unknown"
    energy = payload.clientContext.currentEnergy if payload.clientContext else "Medium"
    focus_mode = payload.clientContext.activeFocusMode if payload.clientContext else False
    
    # 2. Get recent chat history
    history = get_chat_history(uid, limit=10)
    
    # 3. Build Kairo system prompt containing state
    system_prompt = orchestrate_chat_prompt(
        location=location,
        energy=energy,
        focus_mode=focus_mode,
        goals=goals,
        tasks=tasks
    )
    
    # 4. Construct messages payload
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": payload.message})
    
    # 5. Call LLM (using Groq Llama 3.3 for fast responses)
    # If Groq fails, we fallback to Gemini
    try:
        response_text = await call_groq_chat(messages, model="llama-3.3-70b-specdec")
    except Exception as e:
        logger.warning(f"Groq failed, falling back to Gemini: {e}")
        # Convert messages format for Gemini API
        gemini_contents = []
        for msg in messages:
            if msg["role"] != "system":
                gemini_contents.append({
                    "role": "model" if msg["role"] == "assistant" else "user",
                    "parts": [{"text": msg["content"]}]
                })
        response_text = await call_gemini(gemini_contents, system_instruction=system_prompt)
        
    # 6. Parse and execute tool calls
    cleaned_reply, executed_actions = parse_and_execute_tools(uid, response_text)
    
    # 7. Map to SuggestedAction models
    actions = []
    for act in executed_actions:
        actions.append(SuggestedAction(
            actionType=act.get("actionType", ""),
            taskId=act.get("taskId"),
            goalId=act.get("goalId"),
            task=act.get("task"),
            goal=act.get("goal"),
            updates=act.get("updates")
        ))
        
    # 8. Save conversations to chat history
    save_chat_message(uid, "user", payload.message)
    save_chat_message(uid, "assistant", cleaned_reply, context_snapshot={
        "location": location,
        "energy": energy,
        "focusMode": focus_mode
    })
    
    # 9. Formulate response
    timestamp = datetime.now(timezone.utc).isoformat()
    return ChatResponse(
        role="assistant",
        message=cleaned_reply,
        suggestedActions=actions,
        timestamp=timestamp,
        reply=cleaned_reply,
        suggestedAction=actions[0].actionType if actions else ""
    )

@router.get("/daily-brief", response_model=DailyBriefResponse)
async def get_daily_briefing(uid: str = Depends(verify_firebase_token)):
    tasks = get_user_tasks(uid)
    goals = get_user_goals(uid)
    
    system_prompt = orchestrate_daily_brief_prompt(tasks, goals)
    
    contents = [
        {
            "role": "user",
            "parts": [{"text": "Generate my morning daily briefing."}]
        }
    ]
    
    # Call Gemini (with rate limiter)
    try:
        response_text = await call_gemini(contents, system_instruction=system_prompt, model="gemini-1.5-flash")
        
        # Clean response and parse json
        cleaned_json = response_text
        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            cleaned_json = json_match.group(1).strip()
            
        brief_data = json.loads(cleaned_json)
        return DailyBriefResponse(
            greeting=brief_data.get("greeting", "Good morning!"),
            optimalFocusWindow=brief_data.get("optimalFocusWindow", {"start": "09:30:00", "end": "11:30:00"}),
            insights=brief_data.get("insights", "Have a productive day!"),
            scheduleSummary=brief_data.get("scheduleSummary", [])
        )
    except Exception as e:
        logger.error(f"Error generating daily briefing: {e}")
        # Return fallback mock briefing if LLM fails
        return DailyBriefResponse(
            greeting="Good morning! Here is your daily productivity outline.",
            optimalFocusWindow={"start": "09:30:00", "end": "11:30:00"},
            insights="Plan your day and focus on High-Energy tasks first.",
            scheduleSummary=[
                {"time": "09:00", "task": t.get("title", "Work")}
                for t in tasks if t.get("status") in ["pending", "in_progress"]
            ][:2]
        )

class GoalDecomposeRequest(BaseModel):
    goalTitle: str
    targetDate: Optional[str] = None
    category: Optional[str] = "Career"

class GoalMilestoneModel(BaseModel):
    title: str
    targetWeeks: str = "Weeks 1-4"
    progress: int = 0

class DailyTaskModel(BaseModel):
    title: str
    duration: int = 30
    energy: str = "Medium"

class GoalDecomposeResponse(BaseModel):
    milestones: List[GoalMilestoneModel]
    dailyTasks: List[DailyTaskModel]

@router.post("/goal-decompose", response_model=GoalDecomposeResponse)
async def decompose_goal_endpoint(payload: GoalDecomposeRequest):
    prompt = f"""You are Kairo AI Goal Architect.
Break down the macro goal '{payload.goalTitle}' (Category: {payload.category}, Target: {payload.targetDate or 'Open'}) into a strategic roadmap.
Return a JSON object with this exact schema:
{{
  "milestones": [
    {{ "title": "Milestone 1 title", "targetWeeks": "Weeks 1-2", "progress": 0 }},
    {{ "title": "Milestone 2 title", "targetWeeks": "Weeks 3-4", "progress": 0 }},
    {{ "title": "Milestone 3 title", "targetWeeks": "Weeks 5-8", "progress": 0 }}
  ],
  "dailyTasks": [
    {{ "title": "Task 1", "duration": 45, "energy": "High" }},
    {{ "title": "Task 2", "duration": 30, "energy": "Medium" }}
  ]
}}
Only output valid JSON."""

    messages = [
        {"role": "system", "content": "You are a strategic goal decomposition AI. Output JSON only."},
        {"role": "user", "content": prompt}
    ]

    try:
        response_text = await call_groq_chat(messages, model="llama-3.3-70b-versatile")
    except Exception:
        contents = [{"role": "user", "parts": [{"text": prompt}]}]
        response_text = await call_gemini(contents, system_instruction="Output JSON only.")

    cleaned_json = response_text
    json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
    if json_match:
        cleaned_json = json_match.group(1).strip()
    
    try:
        data = json.loads(cleaned_json)
        return GoalDecomposeResponse(
            milestones=data.get("milestones", []),
            dailyTasks=data.get("dailyTasks", [])
        )
    except Exception as e:
        logger.error(f"Error parsing goal decompose response: {e}")
        return GoalDecomposeResponse(
            milestones=[
                GoalMilestoneModel(title="Foundational Knowledge & Setup", targetWeeks="Weeks 1-2", progress=0),
                GoalMilestoneModel(title="Core Implementation & Prototype", targetWeeks="Weeks 3-5", progress=0),
                GoalMilestoneModel(title="Final Polish & Deployment", targetWeeks="Weeks 6-8", progress=0),
            ],
            dailyTasks=[
                DailyTaskModel(title=f"Research & plan architecture for {payload.goalTitle}", duration=45, energy="High"),
                DailyTaskModel(title="Set up implementation workspace", duration=30, energy="Medium"),
            ]
        )


