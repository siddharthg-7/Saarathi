import uuid
import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from app.core.security import sanitize_sensitive_data

logger = logging.getLogger("security.audit")

class AuditEvent(BaseModel):
    id: str = Field(default_factory=lambda: f"audit_{uuid.uuid4().hex}")
    userId: str
    actorId: str
    actorType: str = "user" # "user" | "admin" | "system"
    action: str             # e.g., "memory.delete", "memory.clear", "admin.circuit_reset", "auth.role_change"
    resourceType: str       # e.g., "memory", "user", "circuit_breaker", "device", "cache"
    resourceId: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    ipHash: Optional[str] = None
    userAgentSummary: Optional[str] = None
    result: str = "success" # "success" | "denied" | "error"
    metadata: Dict[str, Any] = Field(default_factory=dict)

# In-memory store for fast query/tests; complemented by Firestore / logging in production
_in_memory_audit_logs: List[AuditEvent] = []

def hash_ip(ip_str: Optional[str]) -> Optional[str]:
    if not ip_str or ip_str in ("127.0.0.1", "localhost", "::1"):
        return "localhost_hash"
    return hashlib.sha256(f"saarathi_salt_{ip_str}".encode()).hexdigest()[:16]

def sanitize_audit_metadata(meta: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strips passwords, tokens, full audio transcripts, and credentials from audit metadata.
    """
    clean_meta = {}
    for k, v in meta.items():
        lower_k = k.lower()
        if any(secret_term in lower_k for secret_term in ["token", "password", "secret", "auth", "key", "credential"]):
            clean_meta[k] = "[REDACTED]"
        elif isinstance(v, str):
            if len(v) > 200:
                clean_meta[k] = sanitize_sensitive_data(v[:197] + "...")
            else:
                clean_meta[k] = sanitize_sensitive_data(v)
        elif isinstance(v, (int, float, bool, list, dict)):
            clean_meta[k] = v
        else:
            clean_meta[k] = str(v)
    return clean_meta

class AuditLogger:
    @classmethod
    def log(
        cls,
        user_id: str,
        action: str,
        resource_type: str,
        actor_id: Optional[str] = None,
        actor_type: str = "user",
        resource_id: Optional[str] = None,
        result: str = "success",
        metadata: Optional[Dict[str, Any]] = None,
        client_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditEvent:
        clean_meta = sanitize_audit_metadata(metadata or {})
        event = AuditEvent(
            userId=user_id,
            actorId=actor_id or user_id,
            actorType=actor_type,
            action=action,
            resourceType=resource_type,
            resourceId=resource_id,
            ipHash=hash_ip(client_ip),
            userAgentSummary=(user_agent[:64] if user_agent else "Unknown"),
            result=result,
            metadata=clean_meta,
        )

        _in_memory_audit_logs.append(event)
        
        # Log to structured security log
        logger.info(
            f"[AUDIT] action={event.action} user={event.userId} actor={event.actorId} "
            f"type={event.actorType} resource={event.resourceType}:{event.resourceId} result={event.result}"
        )

        # Attempt firestore persist if db available
        try:
            from app.services.firestore_service import db
            if db:
                db.collection("audit_logs").document(event.id).set(event.model_dump())
        except Exception as e:
            logger.debug(f"Audit log firestore persist skipped: {e}")

        return event

    @classmethod
    def get_logs(cls, limit: int = 50, filter_user_id: Optional[str] = None) -> List[AuditEvent]:
        logs = _in_memory_audit_logs
        if filter_user_id:
            logs = [l for l in logs if l.userId == filter_user_id]
        return sorted(logs, key=lambda x: x.timestamp, reverse=True)[:limit]

    @classmethod
    def clear_for_testing(cls) -> None:
        _in_memory_audit_logs.clear()

audit_logger = AuditLogger()
