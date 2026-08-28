from fastapi import APIRouter, Depends
from app.core.security import get_current_user, require_admin, AuthUser

router = APIRouter(prefix="/v1/auth", tags=["Auth"])

@router.get("/me")
async def get_current_user_profile(user: AuthUser = Depends(get_current_user)):
    return {
        "uid": user.uid,
        "email": user.email,
        "role": user.role,
        "isAdmin": user.is_admin,
        "status": "authenticated"
    }

@router.get("/admin-check")
async def check_admin_access(admin: AuthUser = Depends(require_admin)):
    return {
        "status": "authorized",
        "uid": admin.uid,
        "role": admin.role,
        "message": "Administrative access verified."
    }
