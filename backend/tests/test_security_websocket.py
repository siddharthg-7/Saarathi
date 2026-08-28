import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_websocket_chat_rejects_invalid_token(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    with client.websocket_connect("/v1/kairo/chat/ws?token=invalid_token_xyz") as websocket:
        data = websocket.receive_json()
        assert data.get("type") == "error"
        assert "Authentication failed" in data.get("message")

def test_websocket_brain_dump_rejects_invalid_token(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    with client.websocket_connect("/v1/brain-dump/ws?token=invalid_token_xyz") as websocket:
        data = websocket.receive_json()
        assert data.get("type") == "error"
        assert "Authentication failed" in data.get("message")

def test_websocket_chat_authenticated_session(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")

    with client.websocket_connect("/v1/kairo/chat/ws?token=test-user-ws-alice") as websocket:
        # Send heartbeat ping
        websocket.send_json({"type": "ping"})
        response = websocket.receive_json()
        assert response["type"] == "pong"
