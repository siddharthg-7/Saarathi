import pytest
from app.services.xai.evidence_engine import EvidenceEngine, MIN_EVIDENCE_SAMPLE_SIZE

def test_explanation_quality_thresholds():
    # Sample < 3 -> insufficient_data
    q0, r0 = EvidenceEngine.evaluate_explanation_quality(0)
    assert q0 == "insufficient_data"

    q2, r2 = EvidenceEngine.evaluate_explanation_quality(2)
    assert q2 == "insufficient_data"

    # Sample 3-4 -> limited_evidence
    q4, r4 = EvidenceEngine.evaluate_explanation_quality(4)
    assert q4 == "limited_evidence"

    # Sample 5-14 -> moderate_evidence
    q10, r10 = EvidenceEngine.evaluate_explanation_quality(10)
    assert q10 == "moderate_evidence"

    # Sample >= 15 -> strong_evidence
    q20, r20 = EvidenceEngine.evaluate_explanation_quality(20)
    assert q20 == "strong_evidence"

def test_extract_task_evidence_with_historical_tasks():
    synthetic_tasks = [
        {"id": f"t_{i}", "category": "Coding", "status": "completed" if i < 3 else "skipped", "postponeCount": 0 if i < 3 else 2}
        for i in range(10)
    ]
    evidence, quality, reason = EvidenceEngine.extract_task_evidence(
        uid="test_user_evidence",
        task_category="Coding",
        scheduled_hour=21,
        day_of_week=1,
        user_tasks=synthetic_tasks,
    )

    assert len(evidence) >= 1
    assert quality in ("moderate_evidence", "strong_evidence")
    
    cat_evidence = next(e for e in evidence if "Coding" in e.fact)
    assert cat_evidence.sampleSize == 10
    assert cat_evidence.isStatisticallySignificant is True
    assert "3 of 10 completed (30%)" in cat_evidence.metric

def test_extract_task_evidence_cold_start():
    # Empty task history
    evidence, quality, reason = EvidenceEngine.extract_task_evidence(
        uid="new_user_cold",
        task_category="Fitness",
        scheduled_hour=9,
        day_of_week=2,
        user_tasks=[],
        telemetry_events=[],
    )

    assert len(evidence) >= 1
    assert quality == "insufficient_data"
    assert evidence[0].isStatisticallySignificant is False
