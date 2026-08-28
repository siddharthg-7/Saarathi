import pytest
from app.core.audit import audit_logger, sanitize_audit_metadata, hash_ip
from app.services.memory.memory_service import MemoryService
from app.models import MemoryCreateRequest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_audit_event_generation_on_sensitive_memory_operations():
    audit_logger.clear_for_testing()
    user_id = "test_audit_user"

    # Index memory then delete it via API
    mem = MemoryService.index_memory(
        uid=user_id,
        req=MemoryCreateRequest(sourceType="note", content="Temporary confidential note", importance=0.5)
    )

    resp = client.delete(
        f"/v1/memory/{mem.id}",
        headers={"Authorization": f"Bearer {user_id}"}
    )
    assert resp.status_code == 200

    logs = audit_logger.get_logs(filter_user_id=user_id)
    assert len(logs) >= 1
    delete_event = next(l for l in logs if l.action == "memory.delete")
    assert delete_event.userId == user_id
    assert delete_event.resourceType == "memory"
    assert delete_event.resourceId == mem.id
    assert delete_event.result == "success"
    assert delete_event.ipHash is not None

def test_audit_metadata_redaction_of_sensitive_data():
    raw_metadata = {
        "user_email": "user@example.com",
        "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMyJ9.eyJuYW1lIjoiQWxpY2UifQ.XYZ",
        "api_key": "AIzaSyB4tj4lMaEa-cW_8d9Tdodz4iy5JSOlHQA",
        "password": "SuperSecretPassword123!",
        "normal_field": "safe_value"
    }

    sanitized = sanitize_audit_metadata(raw_metadata)
    assert sanitized["idToken"] == "[REDACTED]"
    assert sanitized["api_key"] == "[REDACTED]"
    assert sanitized["password"] == "[REDACTED]"
    assert sanitized["normal_field"] == "safe_value"

def test_audit_ip_hashing():
    ip_hash = hash_ip("198.51.100.42")
    assert ip_hash is not None
    assert "198.51.100.42" not in ip_hash # IP is irreversibly hashed for privacy
