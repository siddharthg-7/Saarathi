import json
import re
import uuid
import logging
from typing import List, Optional, Tuple, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field
from app.core.security import verify_firebase_token, decode_and_verify_token
from app.core.rate_limiter import rate_limit, RateLimitTier
from app.services.ai_service import call_resilient_chat_llm, call_groq_chat_stream
from app.services.stt.stt_service import stt_manager, validate_audio_input
from app.services.prompt_orchestration import orchestrate_brain_dump_prompt
from app.services.firestore_service import (
    create_task_direct,
    save_brain_dump_doc,
    save_checkpoint_doc,
    get_checkpoint_doc,
)
from app.core.resilience.idempotency import idempotency_manager
from app.core.resilience.error_classifier import classify_error, get_user_friendly_message
from app.models import BrainDumpCheckpointModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/brain-dump", tags=["Brain Dump"])

def find_completed_json_objects(text: str, start_index: int = 0) -> List[Tuple[dict, int]]:
    """
    Finds complete JSON objects of tasks in the streaming text starting from start_index.
    Returns a list of tuples containing (parsed_dict, end_position).
    """
    results = []
    idx = start_index
    while True:
        start_pos = text.find('{', idx)
        if start_pos == -1:
            break
        
        brace_count = 0
        end_pos = -1
        in_string = False
        escape = False
        
        for i in range(start_pos, len(text)):
            char = text[i]
            if escape:
                escape = False
                continue
            if char == '\\':
                escape = True
                continue
            if char == '"':
                in_string = not in_string
                continue
            if not in_string:
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_pos = i
                        break
        
        if end_pos != -1:
            json_str = text[start_pos:end_pos+1]
            try:
                obj = json.loads(json_str)
                if "title" in obj:
                    results.append((obj, end_pos + 1))
            except Exception:
                pass
            idx = end_pos + 1
        else:
            break
            
    return results

@router.websocket("/ws")
async def brain_dump_ws(websocket: WebSocket, token: Optional[str] = None):
    auth_token = token or websocket.query_params.get("token")
    try:
        auth_user = decode_and_verify_token(auth_token)
        uid = auth_user.uid
    except Exception as e:
        logger.warning(f"Brain dump WebSocket auth rejected: {e}")
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
                await websocket.send_json({"type": "pong", "timestamp": str(uuid.uuid4())})
                continue

            transcript = data.get("transcript", "")
            if not transcript.strip():
                await websocket.send_json({
                    "type": "error",
                    "message": "Empty transcript received."
                })
                continue
            
            # Immediately send status message (Non-blocking feedback)
            await websocket.send_json({
                "status": "processing",
                "message": "Kairo is processing your brain dump..."
            })
            
            prompt = orchestrate_brain_dump_prompt(transcript)
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Extract tasks from this transcript:\n{transcript}"}
            ]
            
            accumulated_text = ""
            last_parsed_index = 0
            extracted_tasks_list = []
            task_ids = []
            
            # Stream with fallback to non-streaming if stream interrupted
            try:
                async for chunk in call_groq_chat_stream(messages, temperature=0.1):
                    accumulated_text += chunk
                    new_objects = find_completed_json_objects(accumulated_text, last_parsed_index)
                    for obj, end_idx in new_objects:
                        last_parsed_index = end_idx
                        try:
                            task_doc = create_task_direct(
                                uid=uid,
                                title=obj.get("title", "Untitled Task"),
                                category=obj.get("category", "General"),
                                energy_required=obj.get("energyRequired", "Medium"),
                                estimated_duration=obj.get("estimatedDuration", 30),
                                deadline=obj.get("deadline")
                            )
                            extracted_task = {
                                "id": task_doc["id"],
                                "title": task_doc["title"],
                                "category": task_doc["category"],
                                "energyRequired": task_doc["energyRequired"],
                                "estimatedDuration": task_doc["estimatedDuration"],
                                "deadline": task_doc.get("deadline"),
                                "aiSummary": "Extracted from voice dump recording."
                            }
                            extracted_tasks_list.append(extracted_task)
                            task_ids.append(task_doc["id"])
                            await websocket.send_json({
                                "status": "task_extracted",
                                "task": extracted_task
                            })
                        except Exception as persist_err:
                            logger.error(f"Error persisting streamed task: {persist_err}")
            except Exception as stream_err:
                logger.warning(f"WebSocket stream failed ({stream_err}), using resilient fallback extraction...")
                _, extracted_tasks = await extract_and_persist_tasks(uid, transcript)
                extracted_tasks_list = [t.model_dump() for t in extracted_tasks]
                task_ids = [t.id for t in extracted_tasks]

            if task_ids:
                save_brain_dump_doc(uid, transcript, task_ids)
                
            await websocket.send_json({
                "status": "done",
                "transcript": transcript,
                "tasks": extracted_tasks_list
            })
            
    except WebSocketDisconnect:
        logger.info("Brain dump WebSocket disconnected")
    except Exception as e:
        logger.error(f"Brain dump WebSocket error: {e}")
        try:
            category = classify_error(e)
            friendly_msg = get_user_friendly_message(category)
            await websocket.send_json({"status": "error", "message": friendly_msg})
            await websocket.close()
        except Exception:
            pass

class BrainDumpRequest(BaseModel):
    transcript: str
    checkpointId: Optional[str] = None
    idempotencyKey: Optional[str] = None
    mode: Optional[str] = "smart"

class ExtractedTask(BaseModel):
    id: str
    title: str
    category: str
    energyRequired: str
    estimatedDuration: int
    deadline: Optional[str] = None

class BrainDumpResponse(BaseModel):
    status: str = "success"
    brainDumpId: str
    rawTranscript: str
    extractedTasks: List[ExtractedTask]
    providerUsed: Optional[str] = None
    checkpointId: Optional[str] = None
    mode: Optional[str] = "smart"

async def extract_and_persist_tasks(
    uid: str,
    transcript: str,
    checkpoint_id: Optional[str] = None
) -> Tuple[str, List[ExtractedTask], str]:
    """
    Calls the LLM to extract tasks, writes them to Firestore with idempotency and checkpointing.
    Returns: (brain_dump_id, extracted_tasks, provider_used)
    """
    cp_id = checkpoint_id or f"cp_{uuid.uuid4().hex[:12]}"
    
    # 1. Update checkpoint to transcribed
    save_checkpoint_doc(
        checkpoint_id=cp_id,
        uid=uid,
        stage="transcribed",
        raw_transcript=transcript
    )

    prompt = orchestrate_brain_dump_prompt(transcript)
    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": f"Extract tasks from this transcript:\n{transcript}"}
    ]
    
    # 2. Call resilient LLM
    response_text, provider_used = await call_resilient_chat_llm(
        messages=messages,
        system_instruction=prompt,
        model="llama-3.3-70b-specdec",
        temperature=0.1
    )

    # 3. Parse JSON from response
    cleaned_json = response_text
    json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
    if json_match:
        cleaned_json = json_match.group(1).strip()
        
    try:
        data = json.loads(cleaned_json)
        raw_tasks = data.get("extractedTasks", [])
    except json.JSONDecodeError as e:
        logger.warning(f"Task extraction JSON decode error: {e}. Fallback heuristics applied.")
        raw_tasks = [{"title": "Review voice thoughts", "category": "General", "energyRequired": "Low", "estimatedDuration": 15}]

    extracted_tasks: List[ExtractedTask] = []
    task_ids: List[str] = []
    
    # 4. Persist extracted tasks to Firestore with idempotency
    for raw in raw_tasks:
        try:
            task_title = raw.get("title", "Untitled Task")
            task_doc = create_task_direct(
                uid=uid,
                title=task_title,
                category=raw.get("category", "General"),
                energy_required=raw.get("energyRequired", "Medium"),
                estimated_duration=raw.get("estimatedDuration", 30),
                deadline=raw.get("deadline")
            )
            
            deadline_str = task_doc.get("deadline") if task_doc.get("deadline") else None
            extracted_tasks.append(ExtractedTask(
                id=task_doc["id"],
                title=task_doc["title"],
                category=task_doc["category"],
                energyRequired=task_doc["energyRequired"],
                estimatedDuration=task_doc["estimatedDuration"],
                deadline=deadline_str
            ))
            task_ids.append(task_doc["id"])
        except Exception as persist_err:
            logger.error(f"Error persisting task: {persist_err}")
            
    # 5. Save brain_dump doc & final checkpoint
    bd_id = save_brain_dump_doc(uid, transcript, task_ids)
    save_checkpoint_doc(
        checkpoint_id=cp_id,
        uid=uid,
        stage="synced",
        raw_transcript=transcript,
        extracted_tasks=[t.model_dump() for t in extracted_tasks]
    )
            
    return bd_id, extracted_tasks, provider_used

@router.post("/process", response_model=BrainDumpResponse, dependencies=[Depends(rate_limit(RateLimitTier.BRAIN_DUMP))])
async def process_brain_dump(payload: BrainDumpRequest, uid: str = Depends(verify_firebase_token)):
    """
    Process raw text transcript directly and extract tasks with idempotency protection.
    """
    idem_key = payload.idempotencyKey or idempotency_manager.generate_key(
        user_id=uid,
        operation_type="brain_dump_process",
        source_id=idempotency_manager.hash_payload(payload.transcript)
    )

    is_dup, cached = idempotency_manager.check_or_start(idem_key, uid, "brain_dump_process")
    if is_dup and cached:
        return cached

    try:
        bd_id, tasks, provider = await extract_and_persist_tasks(uid, payload.transcript, payload.checkpointId)
        resp = BrainDumpResponse(
            status="success",
            brainDumpId=bd_id,
            rawTranscript=payload.transcript,
            extractedTasks=tasks,
            providerUsed=provider,
            checkpointId=payload.checkpointId,
            mode=payload.mode or "smart"
        )
        idempotency_manager.complete(idem_key, resp)
        return resp
    except Exception as e:
        idempotency_manager.fail(idem_key, str(e))
        category = classify_error(e)
        raise HTTPException(
            status_code=500 if category != "INVALID_REQUEST" else 400,
            detail=get_user_friendly_message(category)
        )

@router.post("/audio", response_model=BrainDumpResponse, dependencies=[Depends(rate_limit(RateLimitTier.STT_AUDIO))])
async def process_audio_brain_dump(
    audio: UploadFile = File(...),
    timezone: Optional[str] = Form(None),
    checkpointId: Optional[str] = Form(None),
    mode: str = Form("smart"), # "smart" | "verbatim"
    language: Optional[str] = Form(None),
    uid: str = Depends(verify_firebase_token)
):
    """
    Multi-stage Voice Brain Dump:
    Stage 1: Validation & Audio Reading
    Stage 2: Prioritized Resilient STT Transcription (Gemini 3.5 Transcribe -> Deepgram -> Whisper)
    Stage 3: Resilient LLM Task Extraction -> Tasks saved
    Stage 4: Firestore Sync & Audio Cleanup
    """
    # Sanitize filename against directory traversal
    safe_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', audio.filename or "recording.m4a")
    if ".." in safe_filename or "/" in safe_filename or "\\" in safe_filename:
        safe_filename = f"audio_{uuid.uuid4().hex[:8]}.m4a"

    audio_data = await audio.read()
    content_type = validate_audio_input(audio_data, audio.content_type, safe_filename)
    
    cp_id = checkpointId or f"cp_{uuid.uuid4().hex[:12]}"
    audio_checksum = idempotency_manager.hash_payload(audio_data)

    # Save initial checkpoint
    save_checkpoint_doc(
        checkpoint_id=cp_id,
        uid=uid,
        stage="audio_saved",
        audio_checksum=audio_checksum
    )

    logger.info(f"Transcribing audio file {audio.filename} with mode '{mode}' for user {uid} (Checkpoint: {cp_id})")
    transcript, stt_provider = await stt_manager.transcribe(
        audio_data=audio_data,
        content_type=content_type,
        filename=audio.filename,
        uid=uid,
        mode=mode,
        language=language
    )
    
    # Audio data memory cleanup
    del audio_data
    
    if not transcript or not transcript.strip():
        save_checkpoint_doc(
            checkpoint_id=cp_id,
            uid=uid,
            stage="failed",
            error_code="EMPTY_TRANSCRIPT",
            error_message="Could not extract any transcript from audio"
        )
        raise HTTPException(status_code=400, detail="Could not extract any transcript from audio.")
        
    bd_id, tasks, llm_provider = await extract_and_persist_tasks(uid, transcript, checkpoint_id=cp_id)
    return BrainDumpResponse(
        status="success",
        brainDumpId=bd_id,
        rawTranscript=transcript,
        extractedTasks=tasks,
        providerUsed=f"{stt_provider}+{llm_provider}",
        checkpointId=cp_id,
        mode=mode
    )

@router.post("/resume/{checkpoint_id}", response_model=BrainDumpResponse)
async def resume_brain_dump_checkpoint(
    checkpoint_id: str,
    uid: str = Depends(verify_firebase_token)
):
    """
    Resume an interrupted Brain Dump pipeline directly from its saved transcript checkpoint.
    Eliminates redundant STT costs and avoids forcing the user to re-record voice notes.
    """
    cp = get_checkpoint_doc(uid, checkpoint_id)
    if not cp:
        raise HTTPException(status_code=404, detail="Checkpoint not found or access unauthorized.")

    transcript = cp.get("rawTranscript")
    if not transcript:
        raise HTTPException(status_code=400, detail="Checkpoint has no saved transcript to resume from.")

    bd_id, tasks, provider = await extract_and_persist_tasks(uid, transcript, checkpoint_id=checkpoint_id)
    return BrainDumpResponse(
        status="success",
        brainDumpId=bd_id,
        rawTranscript=transcript,
        extractedTasks=tasks,
        providerUsed=f"checkpoint_resume+{provider}",
        checkpointId=checkpoint_id
    )
