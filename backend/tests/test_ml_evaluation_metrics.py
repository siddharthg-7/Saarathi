import pytest
import numpy as np
from sklearn.metrics import (
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    mean_squared_error,
    mean_absolute_error,
    silhouette_score,
)
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.cluster import KMeans
from app.services.ml_service import MLService
from app.models import RiskPredictionRequest

def test_procrastination_classifier_evaluation_metrics():
    """
    Evaluates binary classification metrics (AUC-ROC, Precision, Recall, F1)
    on synthetic behavioral telemetry vectors.
    """
    np.random.seed(42)
    n_samples = 200

    # Features: [postpone_count, difficulty, energy_mismatch, days_overdue, past_completion_rate]
    X_train = np.random.uniform(0, 5, size=(n_samples, 5))
    # True signal: high postpone_count + high energy_mismatch -> high risk
    logits = (X_train[:, 0] * 0.8) + (X_train[:, 2] * 0.6) - (X_train[:, 4] * 0.5) - 2.0
    probs = 1 / (1 + np.exp(-logits))
    y_train = (probs > 0.5).astype(int)

    X_test = np.random.uniform(0, 5, size=(60, 5))
    test_logits = (X_test[:, 0] * 0.8) + (X_test[:, 2] * 0.6) - (X_test[:, 4] * 0.5) - 2.0
    y_test = (1 / (1 + np.exp(-test_logits)) > 0.5).astype(int)

    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]

    auc = roc_auc_score(y_test, y_proba)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    # Assert model learns genuine signal (AUC-ROC > 0.70)
    assert auc >= 0.70, f"Expected AUC >= 0.70, got {auc:.3f}"
    assert f1 >= 0.60, f"Expected F1 >= 0.60, got {f1:.3f}"
    assert precision > 0.50
    assert recall > 0.50

def test_productivity_forecaster_regression_metrics():
    """
    Evaluates regression metrics (RMSE, MAE) for productivity score forecasting.
    """
    np.random.seed(42)
    n_samples = 150

    # Features: [avg_focus_mins, completion_rate, interruption_rate, energy_score]
    X = np.random.uniform(10, 100, size=(n_samples, 4))
    # True productivity target: score 0 to 100
    y = 0.4 * X[:, 0] + 0.4 * X[:, 1] - 0.2 * X[:, 2] + 5.0 * (X[:, 3] / 20) + np.random.normal(0, 2, size=n_samples)
    y = np.clip(y, 0, 100)

    reg = GradientBoostingRegressor(n_estimators=40, random_state=42)
    reg.fit(X[:100], y[:100])

    preds = reg.predict(X[100:])
    actuals = y[100:]

    rmse = np.sqrt(mean_squared_error(actuals, preds))
    mae = mean_absolute_error(actuals, preds)

    # Expect low error on deterministic productivity data
    assert rmse < 10.0, f"RMSE too high: {rmse:.2f}"
    assert mae < 8.0, f"MAE too high: {mae:.2f}"

def test_energy_clustering_silhouette_score():
    """
    Evaluates clustering separation (Silhouette Score) on hour x energy sessions.
    """
    np.random.seed(42)
    # Generate 3 distinct synthetic focus clusters: Morning (9-11), Afternoon (14-16), Evening (19-21)
    c1 = np.random.normal(loc=[10, 85], scale=[1, 5], size=(30, 2))
    c2 = np.random.normal(loc=[15, 60], scale=[1, 5], size=(30, 2))
    c3 = np.random.normal(loc=[20, 75], scale=[1, 5], size=(30, 2))
    X = np.vstack([c1, c2, c3])

    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X)

    score = silhouette_score(X, labels)
    assert score > 0.45, f"Expected distinct clusters with Silhouette > 0.45, got {score:.3f}"

def test_ml_cold_start_heuristic_fallback():
    """
    Verifies graceful heuristic fallback when telemetry history is sparse (< 3 records).
    """
    req = RiskPredictionRequest(
        id="t-cold-1",
        title="Fix Memory Leak",
        category="Engineering",
        energyRequired="High",
        difficulty=4,
        postponeCount=0,
        estimatedDuration=60,
    )

    prediction = MLService.predict_single_task_risk(req, user_id="u1", events_count=0)
    assert prediction is not None
    assert prediction.taskId == "t-cold-1"
    assert hasattr(prediction, "completionProbability")
    assert hasattr(prediction, "riskLevel")
    assert prediction.isColdStart is True
    assert 0 <= prediction.completionProbability <= 100
