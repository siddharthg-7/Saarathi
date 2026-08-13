import os
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth

try:
    if not firebase_admin._apps:
        firebase_admin.initialize_app()
except Exception:
    pass

security = HTTPBearer(auto_error=False)

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    # Environment mode check
    env = os.getenv("ENVIRONMENT", "development").lower()

    if not credentials:
        if env in ["dev", "development", "local"]:
            return "dev-user-uid"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please include a valid Bearer token in the Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as err:
        if env in ["dev", "development", "local"]:
            return "dev-user-uid"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

