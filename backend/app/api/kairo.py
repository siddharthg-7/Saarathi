import re
import json
import uuid
import base64
import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException
from pydantic import BaseModel
from app.services.stt.gemini_live_bridge import GeminiLiveVoiceBridge, VOICE_PERSONAS
from app.core.security import verify_firebase_token, decode_and_verify_token
from app.core.rate_limiter import rate_limit, RateLimitTier
from app.services.firestore_service import (
    get_user_tasks,
    get_user_goals,
    get_chat_history,
    save_chat_message
)
from app.services.prompt_orchestration import orchestrate_chat_prompt, orchestrate_daily_brief_prompt
from app.services.ai_service import call_groq_chat, call_gemini, call_resilient_chat_llm, call_groq_chat_stream
from app.services.tool_calling import parse_and_execute_tools
from app.services.memory import (
    MemoryIntentDetector,
    hybrid_search_engine,
    MemoryContextBuilder,
    MemoryService,
)
from app.models import MemoryCreateRequest, HybridSearchResultItem
from app.core.resilience.circuit_breaker import circuit_registry
from app.core.resilience.error_classifier import classify_error, get_user_friendly_message
from app.core.resilience.response_cache import llm_cache

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/kairo", tags=["Kairo AI Assistant"])

class ClientContext(BaseModel):
    currentLocation: Optional[str] = "Unknown"
    currentEnergy: Optional[str] = "Medium"
    activeFocusMode: Optional[bool] = False

class ChatRequest(BaseModel):
    message: str
    clientContext: Optional[ClientContext] = None
    requestId: Optional[str] = None

class SuggestedAction(BaseModel):
    actionType: str
    taskId: Optional[str] = None
    goalId: Optional[str] = None
    reminderId: Optional[str] = None
    memoryId: Optional[str] = None
    task: Optional[Dict[str, Any]] = None
    goal: Optional[Dict[str, Any]] = None
    reminder: Optional[Dict[str, Any]] = None
    updates: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    snoozeMinutes: Optional[int] = None
    requiresConfirmation: Optional[bool] = False
    label: Optional[str] = None

class ChatResponse(BaseModel):
    role: str = "assistant"
    message: str = ""
    suggestedActions: List[SuggestedAction] = []
    timestamp: str = ""
    retrievedMemories: Optional[List[HybridSearchResultItem]] = None
    providerUsed: Optional[str] = None
    requestId: Optional[str] = None
    
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
    auth_token = token or websocket.query_params.get("token")
    try:
        auth_user = decode_and_verify_token(auth_token)
        uid = auth_user.uid
    except Exception as e:
        logger.warning(f"WebSocket auth rejected: {e}")
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Authentication failed. Invalid or missing token."})
        await websocket.close(code=1008)
        return

    await websocket.accept()

    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            # Heartbeat ping/pong support
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
                continue

            message = data.get("message", "")
            if not message.strip():
                continue

            client_context = data.get("clientContext", {}) or {}
            location = client_context.get("currentLocation", "Unknown")
            energy = client_context.get("currentEnergy", "Medium")
            focus_mode = client_context.get("activeFocusMode", False)

            # Check explicit memory creation with resilience
            try:
                is_explicit, explicit_fact = MemoryIntentDetector.detect_explicit_memory(message)
                if is_explicit and explicit_fact:
                    MemoryService.index_memory(
                        uid=uid,
                        req=MemoryCreateRequest(
                            sourceType="user_preference",
                            content=explicit_fact,
                            importance=0.9
                        )
                    )
            except Exception as mem_err:
                logger.warning(f"Memory indexing error in WebSocket (graceful degradation): {mem_err}")

            # Retrieve relevant long-term memories if intent requires memory
            memories_context = ""
            retrieved_memories = []
            try:
                if MemoryIntentDetector.requires_memory_retrieval(message):
                    search_res = hybrid_search_engine.search(uid=uid, query=message, match_count=5)
                    retrieved_memories = search_res.results
                    memories_context = MemoryContextBuilder.build_context(retrieved_memories)
            except Exception as ret_err:
                logger.warning(f"Memory search error in WebSocket (degradation Level 3): {ret_err}")
            
            tasks = get_user_tasks(uid)
            goals = get_user_goals(uid)
            history = get_chat_history(uid, limit=10)
            
            system_prompt = orchestrate_chat_prompt(
                location=location,
                energy=energy,
                focus_mode=focus_mode,
                goals=goals,
                tasks=tasks,
                memories_context=memories_context
            )
            
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": message})
            
            full_response = ""
            try:
                async for chunk in call_groq_chat_stream(messages):
                    full_response += chunk
                    await websocket.send_json({
                        "type": "content",
                        "delta": chunk
                    })
            except Exception as e:
                logger.warning(f"Groq streaming failed, attempting resilient fallback: {e}")
                full_response, _ = await call_resilient_chat_llm(
                    messages=messages,
                    system_instruction=system_prompt,
                    model="llama-3.3-70b-specdec"
                )
                await websocket.send_json({
                    "type": "content",
                    "delta": full_response
                })
            
            cleaned_reply, executed_actions = parse_and_execute_tools(uid, full_response)
            
            actions = []
            for act in executed_actions:
                actions.append({
                    "actionType": act.get("actionType", ""),
                    "taskId": act.get("taskId"),
                    "goalId": act.get("goalId"),
                    "reminderId": act.get("reminderId"),
                    "memoryId": act.get("memoryId"),
                    "task": act.get("task"),
                    "goal": act.get("goal"),
                    "reminder": act.get("reminder"),
                    "updates": act.get("updates"),
                    "status": act.get("status"),
                    "snoozeMinutes": act.get("snoozeMinutes"),
                    "requiresConfirmation": act.get("requiresConfirmation", False),
                    "label": act.get("actionType", "").replace('_', ' ').title()
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
        logger.info("Kairo Chat WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            category = classify_error(e)
            await websocket.send_json({
                "type": "error",
                "message": get_user_friendly_message(category)
            })
            await websocket.close()
        except Exception:
            pass

@router.websocket("/live-voice/ws")
async def kairo_live_voice_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    voice: Optional[str] = Query("Puck")
):
    """
    Bidirectional native audio-to-audio WebSocket endpoint powered by Gemini Live API.
    Streams microphone PCM chunks up, receives real-time audio bytes + live transcripts down,
    and executes voice-triggered productivity tool actions with barge-in support.
    """
    await websocket.accept()

    uid = "dev_user"
    if token:
        try:
            uid = decode_and_verify_token(token)
        except Exception:
            logger.debug("Token verification fallback for Live Voice WS")
            uid = "mock_user"

    bridge = GeminiLiveVoiceBridge(voice=voice or "Puck")
    audio_queue: asyncio.Queue = asyncio.Queue()

    # Pre-fetch user context for grounding
    tasks = get_user_tasks(uid)
    goals = get_user_goals(uid)
    system_prompt = orchestrate_chat_prompt(
        location="Real-time Voice",
        energy="High",
        focus_mode=False,
        goals=goals,
        tasks=tasks
    )

    is_running = True

    async def incoming_ws_loop():
        nonlocal is_running
        try:
            while is_running:
                message = await websocket.receive()
                if "bytes" in message and message["bytes"]:
                    await audio_queue.put(message["bytes"])
                elif "text" in message and message["text"]:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")
                    if msg_type == "interrupt":
                        # Client barge-in: flush audio queue
                        while not audio_queue.empty():
                            try:
                                audio_queue.get_nowait()
                            except asyncio.QueueEmpty:
                                break
                    elif msg_type == "set_voice":
                        new_voice = data.get("voice", "Puck")
                        bridge.set_voice(new_voice)
                        await websocket.send_json({
                            "type": "voice_updated",
                            "voice": bridge.voice_name
                        })
                    elif msg_type == "audio_chunk" and "data" in data:
                        raw_pcm = base64.b64decode(data["data"])
                        await audio_queue.put(raw_pcm)
        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.debug(f"Live voice incoming loop ended: {e}")
        finally:
            is_running = False
            await audio_queue.put(None)

    async def outgoing_stream_loop():
        nonlocal is_running
        try:
            # Emit session started confirmation
            await websocket.send_json({
                "type": "session_started",
                "voice": bridge.voice_name,
                "isLive": bridge.is_live_available
            })

            async for event in bridge.stream_live_session(
                incoming_audio_queue=audio_queue,
                system_instruction=system_prompt,
                uid=uid
            ):
                if not is_running:
                    break
                await websocket.send_json(event)
        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.debug(f"Live voice outgoing stream ended: {e}")
        finally:
            is_running = False

    t1 = asyncio.create_task(incoming_ws_loop())
    t2 = asyncio.create_task(outgoing_stream_loop())
    done, pending = await asyncio.wait([t1, t2], return_when=asyncio.FIRST_COMPLETED)
    for p in pending:
        p.cancel()
        try:
            await p
        except (asyncio.CancelledError, Exception):
            pass



@router.post("/chat", response_model=ChatResponse, dependencies=[Depends(rate_limit(RateLimitTier.KAIRO_CHAT))])
async def chat_with_kairo(payload: ChatRequest, uid: str = Depends(verify_firebase_token)):
    req_id = payload.requestId or f"req_{uuid.uuid4().hex[:12]}"

    # 1. Fetch user context & database info
    tasks = get_user_tasks(uid)
    goals = get_user_goals(uid)
    
    location = payload.clientContext.currentLocation if payload.clientContext else "Unknown"
    energy = payload.clientContext.currentEnergy if payload.clientContext else "Medium"
    focus_mode = payload.clientContext.activeFocusMode if payload.clientContext else False
    
    history = get_chat_history(uid, limit=10)
    
    # Check explicit memory creation safely
    try:
        is_explicit, explicit_fact = MemoryIntentDetector.detect_explicit_memory(payload.message)
        if is_explicit and explicit_fact:
            MemoryService.index_memory(
                uid=uid,
                req=MemoryCreateRequest(
                    sourceType="user_preference",
                    content=explicit_fact,
                    importance=0.9
                )
            )
    except Exception as e:
        logger.warning(f"Memory indexing error (graceful degradation): {e}")

    # Retrieve relevant long-term memories safely (Degradation Level 3 if Supabase unavailable)
    memories_context = ""
    retrieved_memories = []
    try:
        if MemoryIntentDetector.requires_memory_retrieval(payload.message):
            search_res = hybrid_search_engine.search(uid=uid, query=payload.message, match_count=5)
            retrieved_memories = search_res.results
            memories_context = MemoryContextBuilder.build_context(retrieved_memories)
    except Exception as e:
        logger.warning(f"Memory retrieval unavailable ({e}), continuing chat without memory context.")

    # 3. Build Kairo system prompt
    system_prompt = orchestrate_chat_prompt(
        location=location,
        energy=energy,
        focus_mode=focus_mode,
        goals=goals,
        tasks=tasks,
        memories_context=memories_context
    )
    
    # 4. Construct messages payload
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": payload.message})
    
    # 5. Call Resilient LLM with fallback chain
    response_text, provider_used = await call_resilient_chat_llm(
        messages=messages,
        system_instruction=system_prompt,
        model="llama-3.3-70b-specdec"
    )
        
    # 6. Parse and execute tool calls
    cleaned_reply, executed_actions = parse_and_execute_tools(uid, response_text)
    
    # 7. Map to SuggestedAction models
    actions = []
    for act in executed_actions:
        actions.append(SuggestedAction(
            actionType=act.get("actionType", ""),
            taskId=act.get("taskId"),
            goalId=act.get("goalId"),
            reminderId=act.get("reminderId"),
            memoryId=act.get("memoryId"),
            task=act.get("task"),
            goal=act.get("goal"),
            reminder=act.get("reminder"),
            updates=act.get("updates"),
            status=act.get("status"),
            snoozeMinutes=act.get("snoozeMinutes"),
            requiresConfirmation=act.get("requiresConfirmation", False),
            label=act.get("actionType", "").replace('_', ' ').title()
        ))
        
    # 8. Save conversations to chat history
    save_chat_message(uid, "user", payload.message)
    save_chat_message(uid, "assistant", cleaned_reply, context_snapshot={
        "location": location,
        "energy": energy,
        "focusMode": focus_mode
    })
    
    timestamp = datetime.now(timezone.utc).isoformat()
    return ChatResponse(
        role="assistant",
        message=cleaned_reply,
        suggestedActions=actions,
        timestamp=timestamp,
        retrievedMemories=retrieved_memories if retrieved_memories else None,
        providerUsed=provider_used,
        requestId=req_id,
        reply=cleaned_reply,
        suggestedAction=actions[0].actionType if actions else ""
    )

@router.get("/daily-brief", response_model=DailyBriefResponse)
async def get_daily_briefing(uid: str = Depends(verify_firebase_token)):
    tasks = get_user_tasks(uid)
    goals = get_user_goals(uid)
    
    system_prompt = orchestrate_daily_brief_prompt(tasks, goals)
    contents = [{"role": "user", "parts": [{"text": "Generate my morning daily briefing."}]}]
    
    try:
        response_text = await call_gemini(contents, system_instruction=system_prompt, model="gemini-1.5-flash")
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
        logger.warning(f"Error generating dynamic daily briefing ({e}), returning safe offline brief.")
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

    # Generate cache key for safe deterministic goal decomposition
    cache_key = llm_cache.generate_cache_key(
        provider="groq",
        model="llama-3.3-70b-versatile",
        prompt=f"{payload.goalTitle}:{payload.category}:{payload.targetDate}",
        feature_version="goal_decompose_v1"
    )

    messages = [
        {"role": "system", "content": "You are a strategic goal decomposition AI. Output JSON only."},
        {"role": "user", "content": prompt}
    ]

    try:
        response_text, _ = await call_resilient_chat_llm(
            messages=messages,
            system_instruction="Output JSON only.",
            model="llama-3.3-70b-versatile",
            cacheable=True,
            cache_key=cache_key
        )
        cleaned_json = response_text
        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            cleaned_json = json_match.group(1).strip()
        data = json.loads(cleaned_json)
        return GoalDecomposeResponse(
            milestones=data.get("milestones", []),
            dailyTasks=data.get("dailyTasks", [])
        )
    except Exception as e:
        logger.warning(f"Goal decompose fallback applied: {e}")
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
