import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Saarathi FastAPI"

def test_telemetry_single_event():
    payload = {
        "id": "evt_test_101",
        "eventType": "task_created",
        "timestamp": "2026-08-23T10:00:00Z",
        "timezone": "Asia/Kolkata",
        "platform": "web",
        "sessionId": "sess_1",
        "entityType": "task",
        "entityId": "task_101",
        "metadata": {
            "title": "Test Task",
            "category": "Coding",
            "estimatedDuration": 45
        }
    }
    response = client.post("/v1/telemetry/event", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "eventId" in data

def test_telemetry_batch_ingestion():
    events = [
        {
            "id": f"evt_batch_{i}",
            "eventType": "task_completed" if i % 2 == 0 else "task_started",
            "timestamp": "2026-08-23T11:00:00Z",
            "timezone": "Asia/Kolkata",
            "platform": "web",
            "sessionId": "sess_batch",
            "entityType": "task",
            "entityId": f"task_{i}",
            "metadata": {"category": "Coding"}
        }
        for i in range(5)
    ]
    response = client.post("/v1/telemetry/batch", json={"events": events})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["processed"] == 5

def test_telemetry_batch_size_limit_rejection():
    # Batch size > 100 must be rejected with 400
    events = [
        {
            "id": f"evt_overflow_{i}",
            "eventType": "task_created",
            "timestamp": "2026-08-23T11:00:00Z",
            "platform": "web",
            "entityType": "task"
        }
        for i in range(105)
    ]
    response = client.post("/v1/telemetry/batch", json={"events": events})
    assert response.status_code == 400

def test_get_daily_analytics():
    response = client.get("/v1/analytics/daily?date=2026-08-23&timezone=Asia/Kolkata")
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-08-23"
    assert data["timezone"] == "Asia/Kolkata"
    assert "tasksPlanned" in data
    assert "tasksCompleted" in data
    assert "focusMinutes" in data
    assert "productivityScore" in data
    assert "hourlyActivity" in data
    assert len(data["hourlyActivity"]) == 24

def test_get_weekly_analytics():
    response = client.get("/v1/analytics/weekly?weekId=2026-W34&timezone=Asia/Kolkata")
    assert response.status_code == 200
    data = response.json()
    assert data["weekId"] == "2026-W34"
    assert "weeklyTasksCompleted" in data
    assert "weeklyCompletionRate" in data
    assert "weeklyFocusMinutes" in data
    assert "comparisonVsLastWeek" in data
    assert len(data["weekdayBreakdown"]) == 7

def test_get_monthly_analytics():
    response = client.get("/v1/analytics/monthly?monthId=2026-08&timezone=Asia/Kolkata")
    assert response.status_code == 200
    data = response.json()
    assert data["monthId"] == "2026-08"
    assert "totalCompletedTasks" in data
    assert "energyPatterns" in data
    assert len(data["energyPatterns"]) == 3
    assert "reschedulingStats" in data
    assert "kairoStats" in data
    assert "descriptiveInsights" in data
    assert len(data["descriptiveInsights"]) > 0

def test_get_ml_dataset_endpoint():
    response = client.get("/v1/analytics/ml-dataset?limit=50")
    assert response.status_code == 200
    data = response.json()
    assert "features" in data
    assert "count" in data
    assert len(data["features"]) > 0
    # Check ML schema fields
    f0 = data["features"][0]
    assert "taskCategory" in f0
    assert "priority" in f0
    assert "estimatedDuration" in f0
    assert "dayOfWeek" in f0
    assert "hourOfDay" in f0
    assert "outcomeTarget" in f0

def test_log_mood_energy_endpoint():
    payload = {
        "energy": "high",
        "mood": "very_good",
        "source": "daily_checkin",
        "notes": "Focused session"
    }
    response = client.post("/v1/analytics/mood-energy", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["log"]["energy"] == "high"
    assert data["log"]["mood"] == "very_good"
