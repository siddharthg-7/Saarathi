import json
import re
import logging
from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from app.core.security import verify_firebase_token
from app.services.ai_service import call_groq_chat, call_gemini, transcribe_audio_deepgram
from app.services.prompt_orchestration import orchestrate_brain_dump_prompt
from app.services.firestore_service import create_task_direct, save_brain_dump_doc

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/brain-dump", tags=["Brain Dump"])

class BrainDumpRequest(BaseModel):
    transcript: str

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

async def extract_and_persist_tasks(uid: str, transcript: str) -> Tuple[str, List[ExtractedTask]]:
    """
    Calls the LLM to extract tasks, writes them to Firestore, and returns list.
    """
    prompt = orchestrate_brain_dump_prompt(transcript)
    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": f"Extract tasks from this transcript:\n{transcript}"}
    ]
    
    try:
        response_text = await call_groq_chat(messages, model="llama-3.3-70b-specdec", temperature=0.1)
    except Exception as e:
        logger.warning(f"Groq failed for task extraction, falling back to Gemini: {e}")
        gemini_contents = [
            {"role": "user", "parts": [{"text": f"Extract tasks from this transcript:\n{transcript}"}]}
        ]
        response_text = await call_gemini(gemini_contents, system_instruction=prompt, temperature=0.1)

    # Parse JSON from response
    cleaned_json = response_text
    json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
    if json_match:
        cleaned_json = json_match.group(1).strip()
        
    try:
        data = json.loads(cleaned_json)
        raw_tasks = data.get("extractedTasks", [])
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse task extraction response: {e}. Output was: {response_text}")
        raw_tasks = []

    extracted_tasks = []
    task_ids = []
    
    for raw in raw_tasks:
        try:
            # Persist directly to Firestore
            task_doc = create_task_direct(
                uid=uid,
                title=raw.get("title", "Untitled Task"),
                category=raw.get("category", "General"),
                energy_required=raw.get("energyRequired", "Medium"),
                estimated_duration=raw.get("estimatedDuration", 30),
                deadline=raw.get("deadline")
            )
            
            # Convert timestamp fields to strings for response
            deadline_str = None
            if task_doc.get("deadline"):
                deadline_str = task_doc["deadline"]
                
            extracted_tasks.append(ExtractedTask(
                id=task_doc["id"],
                title=task_doc["title"],
                category=task_doc["category"],
                energyRequired=task_doc["energyRequired"],
                estimatedDuration=task_doc["estimatedDuration"],
                deadline=deadline_str
            ))
            task_ids.append(task_doc["id"])
        except Exception as e:
            logger.error(f"Error persisting extracted task: {e}")
            
    # Save a brain_dump log doc in Firestore
    bd_id = save_brain_dump_doc(uid, transcript, task_ids)
            
    return bd_id, extracted_tasks

@router.post("/process", response_model=BrainDumpResponse)
async def process_brain_dump(payload: BrainDumpRequest, uid: str = Depends(verify_firebase_token)):
    """
    Process raw text transcript directly and extract tasks.
    """
    bd_id, tasks = await extract_and_persist_tasks(uid, payload.transcript)
    return BrainDumpResponse(
        status="success",
        brainDumpId=bd_id,
        rawTranscript=payload.transcript,
        extractedTasks=tasks
    )

@router.post("/audio", response_model=BrainDumpResponse)
async def process_audio_brain_dump(
    audio: UploadFile = File(...),
    timezone: Optional[str] = Form(None),
    uid: str = Depends(verify_firebase_token)
):
    """
    Transcribe raw audio via Deepgram and extract tasks.
    """
    # Read audio content
    audio_data = await audio.read()
    
    # Transcribe via Deepgram
    logger.info(f"Transcribing audio file {audio.filename} for user {uid}")
    transcript = await transcribe_audio_deepgram(audio_data, content_type=audio.content_type)
    
    if not transcript:
        raise HTTPException(status_code=400, detail="Could not extract any transcript from audio")
        
    bd_id, tasks = await extract_and_persist_tasks(uid, transcript)
    return BrainDumpResponse(
        status="success",
        brainDumpId=bd_id,
        rawTranscript=transcript,
        extractedTasks=tasks
    )

