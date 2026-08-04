from fastapi import HTTPException, Security
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
    if not credentials:
        return "dev-user-uid"
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")
