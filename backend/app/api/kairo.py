from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.security import verify_firebase_token

router = APIRouter(prefix="/v1/kairo", tags=["Kairo AI Assistant"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str = ""
    suggestedAction: str = ""

@router.post("/chat", response_model=ChatResponse)
async def chat_with_kairo(payload: ChatRequest, uid: str = Depends(verify_firebase_token)):
    return ChatResponse(
        reply=f"Kairo received your message: '{payload.message}'. How can I assist with your productivity today?",
        suggestedAction="view_schedule"
    )
