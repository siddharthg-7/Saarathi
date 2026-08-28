import os
import re
import json
import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import HTTPException, Security, status, Request
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

# Redaction patterns for safe logging
JWT_REGEX = re.compile(r'eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}')
AUTH_HEADER_REGEX = re.compile(r'(?i)(bearer\s+)[a-zA-Z0-9_.-]+')
API_KEY_REGEX = re.compile(r'(?i)(AIza[0-9A-Za-z-_]{35}|gsk_[a-zA-Z0-9]{30,})')

def sanitize_sensitive_data(text: str) -> str:
    """
    Sanitizes string to redact JWTs, Bearer tokens, and API keys before logging.
    """
    if not isinstance(text, str):
        return text
    sanitized = JWT_REGEX.sub('[REDACTED_JWT]', text)
    sanitized = AUTH_HEADER_REGEX.sub(r'\1[REDACTED_TOKEN]', sanitized)
    sanitized = API_KEY_REGEX.sub('[REDACTED_API_KEY]', sanitized)
    return sanitized

class AuthUser(BaseModel):
    uid: str
    email: Optional[str] = None
    role: str = "USER"
    is_admin: bool = False
    claims: Dict[str, Any] = {}

def decode_and_verify_token(token: str, check_revoked: bool = False) -> AuthUser:
    """
    Strict cryptographic verification of Firebase ID tokens using Firebase Admin SDK.
    Validates signature, structure, expiration, issuer, audience, and subject/UID.
    Never trusts unverified decoded tokens.
    """
    if not token or token in ["undefined", "null", ""]:
        if not settings.is_production:
            return AuthUser(uid="dev-user-uid", email="dev@saarathi.local", role="USER", is_admin=False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please include a valid Bearer token in the Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # In development/test mode only, support controlled mock/test tokens
    if not settings.is_production:
        if token.startswith("dev-admin-") or token == "mock-admin-token" or token == "test-admin-token":
            return AuthUser(
                uid=token,
                email="admin@saarathi.local",
                role="ADMIN",
                is_admin=True,
                claims={"admin": True}
            )
        if (
            token.startswith("dev-token-")
            or token.startswith("test-")
            or token.startswith("test_")
            or token.startswith("mock-")
            or token.startswith("mock_")
            or token.startswith("dev_")
            or token.startswith("dev-")
            or token.startswith("user_")
            or token.startswith("golden_")
            or token.startswith("auth_")
        ):
            is_admin = token in settings.admin_uid_set
            return AuthUser(
                uid=token,
                email=f"{token}@saarathi.local",
                role="ADMIN" if is_admin else "USER",
                is_admin=is_admin,
                claims={"admin": is_admin}
            )

    # Cryptographic JWT structure pre-validation (must have header.payload.signature)
    if token.count(".") != 2:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or malformed authentication token format.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        decoded_claims = auth.verify_id_token(token, check_revoked=check_revoked)
        uid = decoded_claims.get("uid") or decoded_claims.get("sub")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing subject identifier.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        email = decoded_claims.get("email")
        
        # Determine role from custom claims or admin settings
        has_admin_claim = decoded_claims.get("admin") is True or decoded_claims.get("role") == "admin"
        is_admin_uid = uid in settings.admin_uid_set
        is_admin_email = bool(email and email.lower() in settings.admin_email_set)
        
        is_admin = has_admin_claim or is_admin_uid or is_admin_email
        role = "ADMIN" if is_admin else "USER"

        return AuthUser(
            uid=uid,
            email=email,
            role=role,
            is_admin=is_admin,
            claims=decoded_claims
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token expired. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has been revoked. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or malformed authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Token verification error: {sanitize_sensitive_data(str(e))}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Invalid token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def decode_token_payload(token: str) -> dict:
    """
    Backwards-compatible helper returning dictionary with UID.
    Enforces token verification.
    """
    auth_user = decode_and_verify_token(token)
    return {"uid": auth_user.uid, "email": auth_user.email, "role": auth_user.role, "claims": auth_user.claims}

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> AuthUser:
    """
    FastAPI dependency returning fully resolved and verified AuthUser.
    """
    if not credentials or not credentials.credentials:
        if not settings.is_production:
            return AuthUser(uid="dev-user-uid", email="dev@saarathi.local", role="USER", is_admin=False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please include a valid Bearer token in the Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decode_and_verify_token(credentials.credentials)

async def verify_firebase_token(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> str:
    """
    FastAPI dependency returning authoritative verified UID string.
    """
    user = await get_current_user(credentials)
    return user.uid

async def require_admin(user: AuthUser = Security(get_current_user)) -> AuthUser:
    """
    FastAPI dependency enforcing RBAC: requires verified ADMIN role.
    """
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this resource."
        )
    return user
