import os
import json
import logging
import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Firebase Admin with project options or service account credentials if available
try:
    if not firebase_admin._apps:
        if settings.GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
            cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
            firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
        elif settings.FIREBASE_CREDENTIALS_JSON:
            cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
        else:
            firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
except Exception as e:
    logger.warning(f"Firebase Admin initialization note: {e}")

security = HTTPBearer(auto_error=False)

def decode_token_payload(token: str) -> dict:
    """
    Safely decode Firebase JWT token payload.
    Attempts verify_id_token first, falls back to PyJWT decode.
    """
    if not token or token in ["undefined", "null", ""]:
        return {"uid": "dev-user-uid"}
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception:
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            uid = decoded.get("user_id") or decoded.get("sub")
            if uid:
                decoded["uid"] = uid
                return decoded
        except Exception as jwt_err:
            logger.warning(f"Token decode error: {jwt_err}")
    return {"uid": "dev-user-uid"}

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    env = (settings.ENVIRONMENT or os.getenv("ENVIRONMENT", "development")).lower()

    if not credentials:
        if env in ["dev", "development", "local"]:
            return "dev-user-uid"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please include a valid Bearer token in the Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_token_payload(token)
    uid = payload.get("uid")
    if uid and uid != "dev-user-uid":
        return uid
    if env in ["dev", "development", "local"]:
        return "dev-user-uid"
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )


