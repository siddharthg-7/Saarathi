from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from app.core.security import verify_firebase_token

router = APIRouter(prefix="/v1/brain-dump", tags=["Brain Dump"])

class BrainDumpRequest(BaseModel):
    transcript: str

class ExtractedTask(BaseModel):
    title: str
    category: str
    energyRequired: str

class BrainDumpResponse(BaseModel):
    extractedTasks: List[ExtractedTask]

@router.post("/process", response_model=BrainDumpResponse)
async def process_brain_dump(payload: BrainDumpRequest, uid: str = Depends(verify_firebase_token)):
    lines = [line.strip("- ") for line in payload.transcript.split("\n") if line.strip()]
    tasks = [
        ExtractedTask(
            title=line,
            category="Coding" if "code" in line.lower() else "General",
            energyRequired="High" if "urgent" in line.lower() else "Medium"
        )
        for line in lines
    ]
    return BrainDumpResponse(extractedTasks=tasks)
