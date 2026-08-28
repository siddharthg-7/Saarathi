import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_resilience_health_endpoint():
    response = client.get("/v1/resilience/health")
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data
    assert "groq" in data["providers"]
    assert "gemini" in data["providers"]
    assert "deepgram" in data["providers"]
    assert "whisper" in data["providers"]
    assert data["degradationLevel"] in (0, 1, 2, 3, 4)

def test_resilience_metrics_endpoint():
    response = client.get("/v1/resilience/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "providerSuccessRate" in data
    assert "fallbackRate" in data
    assert "avgLatencyMs" in data
    assert "p95LatencyMs" in data
    assert "cacheHitRate" in data

def test_resilience_circuit_reset_endpoint():
    response = client.post(
        "/v1/resilience/circuit/reset",
        json={"provider": "groq"},
        headers={"Authorization": "Bearer dev-admin-operator"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "groq" in data["resetProviders"]

def test_resilience_cache_endpoints():
    stats_res = client.get(
        "/v1/resilience/cache/stats",
        headers={"Authorization": "Bearer dev-admin-operator"}
    )
    assert stats_res.status_code == 200
    assert "hits" in stats_res.json()

    clear_res = client.post(
        "/v1/resilience/cache/clear",
        headers={"Authorization": "Bearer dev-admin-operator"}
    )
    assert clear_res.status_code == 200
    assert clear_res.json()["status"] == "ok"
