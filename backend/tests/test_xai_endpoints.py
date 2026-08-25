import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_feature_registry_endpoint():
    response = client.get("/v1/xai/feature-registry")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "1.0.0"
    assert data["count"] >= 8
    features = {f["feature"]: f for f in data["features"]}
    assert "postpone_count" in features
    assert features["postpone_count"]["displayName"] == "Reschedule Frequency"
    assert features["time_of_day"]["category"] == "temporal"

def test_explain_task_endpoint():
    payload = {"taskId": "task_demo_101"}
    response = client.post("/v1/xai/explain-task", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["taskId"] == "task_demo_101"
    assert "contributors" in data
    assert len(data["contributors"]) > 0
    assert "evidence" in data
    assert "modelMetadata" in data
    assert data["modelMetadata"]["modelName"] == "task_risk_rf"

def test_recommend_schedule_endpoint():
    payload = {
        "taskId": "task_demo_schedule_102",
        "targetDate": "2026-08-25"
    }
    response = client.post("/v1/xai/recommend-schedule", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommendation" in data
    rec = data["recommendation"]
    assert rec["taskId"] == "task_demo_schedule_102"
    assert rec["currentSchedule"]["startHour"] == 21
    assert rec["recommendedSchedule"]["startHour"] == 9
    assert rec["predictedImprovement"] > 0
    assert len(rec["contributors"]) > 0

def test_predict_risk_includes_xai_explanation():
    payload = {
        "id": "task_xai_pred_1",
        "title": "Build Architecture",
        "category": "Coding",
        "priority": "High",
        "postponeCount": 2,
        "energyRequired": "High",
        "estimatedDuration": 90,
    }
    response = client.post("/v1/ml/predict-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data
    assert data["explanation"] is not None
    assert data["explanation"]["taskId"] == "task_xai_pred_1"
    assert len(data["explanation"]["contributors"]) > 0
    assert len(data["explanation"]["evidence"]) > 0
    assert "modelMetadata" in data
    assert data["modelMetadata"]["modelVersion"] == "1.0.0"

def test_predict_batch_risk_includes_xai_explanations():
    payload = {
        "tasks": [
            {
                "id": "t_batch_1",
                "title": "Review PR",
                "category": "Coding",
                "priority": "Medium",
                "postponeCount": 0,
                "energyRequired": "Medium",
                "estimatedDuration": 20,
            },
            {
                "id": "t_batch_2",
                "title": "Database Optimization",
                "category": "Backend",
                "priority": "Urgent",
                "postponeCount": 3,
                "energyRequired": "High",
                "estimatedDuration": 120,
            }
        ]
    }
    response = client.post("/v1/ml/predict-batch-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["predictions"]) == 2
    for pred in data["predictions"]:
        assert "explanation" in pred
        assert pred["explanation"] is not None
        assert len(pred["explanation"]["contributors"]) > 0
