import pytest
from app.services.xai.local_explainer import LocalExplainer, determine_strength, determine_direction
from app.services.xai.feature_registry import get_feature_metadata, list_all_feature_metadata

def test_feature_registry_lookup():
    meta = get_feature_metadata("postpone_count")
    assert meta.displayName == "Reschedule Frequency"
    assert meta.category == "behavioral_history"
    assert meta.unit == "count"

    all_features = list_all_feature_metadata()
    assert len(all_features) >= 8
    feature_names = [f.feature for f in all_features]
    assert "time_of_day" in feature_names
    assert "historical_completion_rate" in feature_names

def test_determine_strength_and_direction():
    assert determine_direction(0.25) == "positive"
    assert determine_direction(-0.25) == "negative"
    assert determine_direction(0.0) == "neutral"

    assert determine_strength(0.5) == "strong_positive"
    assert determine_strength(0.2) == "positive"
    assert determine_strength(0.0) == "neutral"
    assert determine_strength(-0.2) == "negative"
    assert determine_strength(-0.5) == "strong_negative"

def test_local_explainer_high_postpone_task():
    task_dict = {
        "postponeCount": 3,
        "estimatedDuration": 120,
        "priority": "Urgent",
        "energyRequired": "High",
        "scheduledHour": 21,
        "dayOfWeek": 1, # Monday
        "historicalCompletionRate": 25.0,
    }
    contributors = LocalExplainer.explain_task_risk(task_dict, base_probability=82.0)
    assert len(contributors) >= 5

    # Check importance ranking is sequential 1, 2, 3...
    ranks = [c.importanceRank for c in contributors]
    assert ranks == list(range(1, len(contributors) + 1))

    # Postpone count and time of day should be top positive (increasing risk) contributors
    top_features = [c.feature for c in contributors[:3]]
    assert "postpone_count" in top_features
    
    postpone_contrib = next(c for c in contributors if c.feature == "postpone_count")
    assert postpone_contrib.direction == "positive"
    assert postpone_contrib.strength in ("strong_positive", "positive")

def test_local_explainer_low_risk_morning_task():
    task_dict = {
        "postponeCount": 0,
        "estimatedDuration": 25,
        "priority": "Medium",
        "energyRequired": "Medium",
        "scheduledHour": 10, # Morning deep focus
        "dayOfWeek": 2, # Tuesday
        "historicalCompletionRate": 90.0,
    }
    contributors = LocalExplainer.explain_task_risk(task_dict, base_probability=15.0)
    assert len(contributors) >= 5

    # Morning timing and high historical completion should have negative direction (reducing skip risk)
    time_contrib = next(c for c in contributors if c.feature == "time_of_day")
    assert time_contrib.direction == "negative"
    assert time_contrib.strength in ("strong_negative", "negative")
