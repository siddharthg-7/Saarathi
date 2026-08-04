from fastapi import APIRouter, Depends
from app.core.security import verify_firebase_token

router = APIRouter(prefix="/v1/auth", tags=["Auth"])

@router.get("/me")
async def get_current_user(uid: str = Depends(verify_firebase_token)):
    return {"uid": uid, "status": "authenticated"}
