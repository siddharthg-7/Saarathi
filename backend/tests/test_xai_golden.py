import pytest
from app.models import RiskPredictionRequest
from app.services.xai.xai_service import XAIService
from app.services.xai.schedule_optimizer import ScheduleOptimizer

def test_golden_fixture_monday_gym_procrastination():
    """
    Golden Fixture:
    Monday 9 PM Gym Task with 4 skipped / 1 completed in recent history.
    Model predicts high skip risk (82%).
    """
    gym_tasks = [
        {"id": "g1", "category": "Fitness", "status": "completed", "postponeCount": 0},
        {"id": "g2", "category": "Fitness", "status": "skipped", "postponeCount": 2},
        {"id": "g3", "category": "Fitness", "status": "skipped", "postponeCount": 1},
        {"id": "g4", "category": "Fitness", "status": "skipped", "postponeCount": 3},
        {"id": "g5", "category": "Fitness", "status": "skipped", "postponeCount": 1},
    ]

    task_req = RiskPredictionRequest(
        id="golden_gym_task_1",
        title="Evening Gym Workout",
        category="Fitness",
        priority="Medium",
        postponeCount=2,
        energyRequired="High",
        estimatedDuration=60,
    )

    explanation = XAIService.generate_task_explanation(
        task=task_req,
        uid="golden_user_1",
        skip_probability=82.0,
        is_cold_start=False,
        user_tasks=gym_tasks,
    )

    assert explanation.probability == 82.0
    assert explanation.predictionType == "task_risk"
    assert len(explanation.contributors) >= 4

    # Postpone count and time of day must be identified among top factors
    top_factor_names = [c.feature for c in explanation.contributors[:3]]
    assert "postpone_count" in top_factor_names

    # Check evidence fact matches fixture numbers
    fitness_ev = next(e for e in explanation.evidence if "Fitness" in e.fact)
    assert fitness_ev.sampleSize == 5
    assert fitness_ev.value == 20  # 1/5 = 20%
    assert "1 of 5 completed (20%)" in fitness_ev.metric

    # Verify model metadata traceability
    assert explanation.modelMetadata.modelName == "task_risk_rf"
    assert explanation.modelMetadata.modelVersion == "1.0.0"
    assert explanation.modelMetadata.featureVersion == "1.0.0"

def test_golden_fixture_schedule_recommendation():
    """
    Golden Fixture:
    Task currently scheduled for 9 PM with high postponement.
    Optimizer recommends moving to morning 9 AM peak focus window with predicted improvement.
    """
    rec = ScheduleOptimizer.generate_schedule_recommendation(
        uid="golden_user_2",
        task_id="golden_task_2",
        task_data={
            "id": "golden_task_2",
            "title": "Deep Architecture Study",
            "category": "Study",
            "priority": "High",
            "postponeCount": 2,
            "energyRequired": "High",
            "estimatedDuration": 45,
        }
    )

    assert rec.currentSchedule.startHour == 21
    assert rec.recommendedSchedule.startHour == 9
    assert rec.predictedImprovement > 0
    assert rec.recommendedSchedule.predictedCompletion > rec.currentSchedule.predictedCompletion
    assert "Peak Deep Focus" in rec.reason
