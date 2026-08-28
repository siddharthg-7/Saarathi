import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ml_service import MLService
from app.models import RiskPredictionRequest, TaskClusterItemModel

client = TestClient(app)

def test_predict_single_task_risk():
    payload = {
        "id": "task_risk_101",
        "title": "Complex Database Migration",
        "category": "Backend",
        "priority": "Urgent",
        "postponeCount": 2,
        "energyRequired": "High",
        "estimatedDuration": 120,
    }
    response = client.post("/v1/ml/predict-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["taskId"] == "task_risk_101"
    assert data["highRisk"] is True
    assert data["riskLevel"] in ("high", "critical")
    assert data["skipProbability"] > 30.0
    assert data["delayProbability"] > 40.0
    assert len(data["contributingFactors"]) > 0
    assert data["recommendedAction"] is not None

def test_predict_batch_task_risk():
    payload = {
        "tasks": [
            {
                "id": "task_1",
                "title": "Quick Email Reply",
                "category": "Admin",
                "priority": "Low",
                "postponeCount": 0,
                "energyRequired": "Low",
                "estimatedDuration": 10,
            },
            {
                "id": "task_2",
                "title": "Refactor Architecture",
                "category": "Engineering",
                "priority": "Urgent",
                "postponeCount": 3,
                "energyRequired": "High",
                "estimatedDuration": 180,
            },
        ],
        "eventsCount": 60,
    }
    response = client.post("/v1/ml/predict-batch-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["predictions"]) == 2
    assert data["highRiskCount"] >= 1
    assert data["predictions"][0]["highRisk"] is False
    assert data["predictions"][1]["highRisk"] is True
    assert data["isColdStart"] is False

def test_cluster_energy_windows():
    user_id = "user_test_ml"
    hourly_stats = [
        {"hour": h, "productivityScore": 85 if 9 <= h <= 12 else 40, "focusMinutes": 45 if 9 <= h <= 12 else 10, "completionRate": 80 if 9 <= h <= 12 else 50}
        for h in range(24)
    ]
    payload = {
        "userId": user_id,
        "hourlyStats": hourly_stats,
    }
    response = client.post(
        "/v1/ml/cluster-energy",
        json=payload,
        headers={"Authorization": f"Bearer {user_id}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["userId"] == user_id
    assert len(data["clusters"]) == 3
    assert len(data["optimalTimeSlots"]) > 0
    assert "Peak Deep Work" in [c["name"] for c in data["clusters"]]

def test_detect_burnout():
    user_id = "user_burnout_test"
    daily_stats = [
        {"date": f"2026-08-{i:02d}", "focusMinutes": 380 if i > 15 else 120, "tasksPlanned": 10, "tasksCompleted": 5, "tasksOverdue": 4, "tasksRescheduled": 3, "interruptionCount": 8}
        for i in range(10, 20)
    ]
    payload = {
        "userId": user_id,
        "recentDailyStats": daily_stats,
    }
    response = client.post(
        "/v1/ml/detect-burnout",
        json=payload,
        headers={"Authorization": f"Bearer {user_id}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["userId"] == user_id
    assert "burnoutRiskScore" in data
    assert data["burnoutRiskScore"] > 0
    assert len(data["contributingIndicators"]) > 0
    assert len(data["recommendations"]) > 0

def test_forecast_productivity():
    user_id = "user_forecast_test"
    daily_stats = [
        {"date": f"2026-08-{i:02d}", "tasksCompleted": 5 + (i % 3), "focusMinutes": 150 + (i * 5)}
        for i in range(1, 15)
    ]
    payload = {
        "userId": user_id,
        "historicalDailyStats": daily_stats,
        "forecastDaysCount": 7,
    }
    response = client.post(
        "/v1/ml/forecast-productivity",
        json=payload,
        headers={"Authorization": f"Bearer {user_id}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["userId"] == user_id
    assert len(data["forecastDays"]) == 7
    assert data["expectedWeeklyCompleted"] > 0
    assert data["expectedWeeklyFocusMinutes"] > 0
    assert data["trendDirection"] in ("upward", "steady", "downward")
    assert data["isColdStart"] is False

def test_cluster_tasks_semantically():
    payload = {
        "tasks": [
            {"id": "t1", "title": "Build FastAPI backend endpoints", "category": "Backend", "tags": ["python", "api"]},
            {"id": "t2", "title": "Implement PostgreSQL database migration", "category": "Backend", "tags": ["sql", "database"]},
            {"id": "t3", "title": "Design React button UI component", "category": "Frontend", "tags": ["css", "react"]},
            {"id": "t4", "title": "Fix Tailwind styling in Mobile navbar", "category": "Frontend", "tags": ["ui", "navbar"]},
            {"id": "t5", "title": "Prepare quarterly marketing budget", "category": "Finance", "tags": ["budget", "excel"]},
        ],
        "numClusters": 3,
    }
    response = client.post("/v1/ml/cluster-tasks", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["totalTasks"] == 5
    assert len(data["clusters"]) >= 2
