import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
from app.main import app
from app.core.security import decode_and_verify_token, AuthUser
from app.core.config import settings

client = TestClient(app)

def test_missing_auth_token_in_production_mode(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    
    # Request without Authorization header
    response = client.get("/v1/auth/me")
    assert response.status_code == 401
    assert "token required" in response.json()["detail"].lower()

def test_invalid_auth_token():
    # Invalid garbage Bearer token
    response = client.get(
        "/v1/auth/me",
        headers={"Authorization": "Bearer invalid_garbage_jwt_token_12345"}
    )
    assert response.status_code == 401

def test_dev_token_in_development_mode(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    
    response = client.get(
        "/v1/auth/me",
        headers={"Authorization": "Bearer test-user-alice"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == "test-user-alice"
    assert data["role"] == "USER"
    assert data["isAdmin"] is False

def test_admin_token_resolution(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    
    response = client.get(
        "/v1/auth/me",
        headers={"Authorization": "Bearer dev-admin-bob"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == "dev-admin-bob"
    assert data["role"] == "ADMIN"
    assert data["isAdmin"] is True

def test_production_mode_rejects_mock_tokens(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    
    # In production, mock tokens like 'test-user-123' must be rejected
    response = client.get(
        "/v1/auth/me",
        headers={"Authorization": "Bearer test-user-unauthorized"}
    )
    assert response.status_code == 401
