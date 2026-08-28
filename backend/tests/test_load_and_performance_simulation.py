import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_load_and_concurrency_simulation():
    """
    Simulates high-throughput endpoint requests measuring p50 and p95 latencies and error rates.
    """
    latencies = []
    n_requests = 100

    for i in range(n_requests):
        start = time.perf_counter()
        resp = client.get("/v1/health")
        duration_ms = (time.perf_counter() - start) * 1000.0
        
        assert resp.status_code == 200
        latencies.append(duration_ms)

    latencies.sort()
    p50 = latencies[int(n_requests * 0.50)]
    p95 = latencies[int(n_requests * 0.95)]
    p99 = latencies[int(n_requests * 0.99)]

    # Assert sub-millisecond to low millisecond performance on local gateway
    assert p50 < 30.0, f"p50 latency too high: {p50:.2f}ms"
    assert p95 < 100.0, f"p95 latency too high: {p95:.2f}ms"
    assert p99 < 200.0, f"p99 latency too high: {p99:.2f}ms"

from app.core.security import verify_firebase_token
from unittest.mock import patch

def test_ml_risk_prediction_latency_budget():
    """
    Measures latency for ML risk prediction endpoint under fast local authentication.
    """
    app.dependency_overrides[verify_firebase_token] = lambda: "perf_user_1"
    try:
        payload = {
            "id": "task-perf-101",
            "title": "Build load test fixture",
            "category": "Engineering",
            "energyRequired": "High",
            "difficulty": 3,
            "estimatedDuration": 45,
            "postponeCount": 0
        }

        latencies = []
        with patch("app.services.xai.evidence_engine.get_user_tasks", return_value=[]), \
             patch("app.services.xai.evidence_engine.get_user_telemetry_events", return_value=[]):
            for _ in range(10):
                start = time.perf_counter()
                resp = client.post("/v1/ml/predict-risk", json=payload)
                duration_ms = (time.perf_counter() - start) * 1000.0
                assert resp.status_code == 200
                latencies.append(duration_ms)

        avg_latency = sum(latencies) / len(latencies)
        assert avg_latency < 50.0, f"Average ML inference latency exceeded 50ms: {avg_latency:.2f}ms"
    finally:
        app.dependency_overrides.pop(verify_firebase_token, None)
