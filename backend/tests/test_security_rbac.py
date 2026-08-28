import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_normal_user_blocked_from_admin_check():
    # User token
    response = client.get(
        "/v1/auth/admin-check",
        headers={"Authorization": "Bearer test-user-charlie"}
    )
    assert response.status_code == 403
    assert "administrative privileges required" in response.json()["detail"].lower()

def test_admin_user_permitted_on_admin_check():
    # Admin token
    response = client.get(
        "/v1/auth/admin-check",
        headers={"Authorization": "Bearer dev-admin-super"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "authorized"

def test_normal_user_cannot_reset_circuits():
    response = client.post(
        "/v1/resilience/circuit/reset",
        json={"provider": "groq"},
        headers={"Authorization": "Bearer test-user-dave"}
    )
    assert response.status_code == 403

def test_admin_can_reset_circuits():
    response = client.post(
        "/v1/resilience/circuit/reset",
        json={"provider": "groq"},
        headers={"Authorization": "Bearer dev-admin-operator"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_normal_user_cannot_clear_response_cache():
    response = client.post(
        "/v1/resilience/cache/clear",
        headers={"Authorization": "Bearer test-user-eve"}
    )
    assert response.status_code == 403

def test_admin_can_clear_response_cache():
    response = client.post(
        "/v1/resilience/cache/clear",
        headers={"Authorization": "Bearer dev-admin-operator"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
