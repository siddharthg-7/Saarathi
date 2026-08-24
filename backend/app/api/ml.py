from typing import Optional
from fastapi import APIRouter, Depends
from app.models import (
    RiskPredictionRequest,
    RiskPredictionResponse,
    BatchRiskPredictionRequest,
    BatchRiskPredictionResponse,
    EnergyClusterRequest,
    EnergyClusterResponse,
    BurnoutDetectionRequest,
    BurnoutDetectionResponse,
    ProductivityForecastRequest,
    ProductivityForecastResponse,
    TaskSemanticClusterRequest,
    TaskSemanticClusterResponse,
)
from app.core.security import verify_firebase_token
from app.services.ml_service import MLService

router = APIRouter(prefix="/v1/ml", tags=["Machine Learning"])

@router.post("/predict-risk", response_model=RiskPredictionResponse)
async def predict_task_risk(
    payload: RiskPredictionRequest,
    uid: str = Depends(verify_firebase_token)
):
    return MLService.predict_single_task_risk(payload, user_id=uid)

@router.post("/predict-batch-risk", response_model=BatchRiskPredictionResponse)
async def predict_batch_risk(
    payload: BatchRiskPredictionRequest,
    uid: str = Depends(verify_firebase_token)
):
    return MLService.predict_batch_risk(
        tasks=payload.tasks,
        user_id=uid or payload.userId,
        events_count=payload.eventsCount,
    )

@router.post("/cluster-energy", response_model=EnergyClusterResponse)
async def cluster_energy_windows(
    payload: EnergyClusterRequest,
    uid: str = Depends(verify_firebase_token)
):
    user_id = payload.userId or uid or "default_user"
    return MLService.cluster_energy_windows(
        user_id=user_id,
        hourly_stats=payload.hourlyStats,
        events=payload.events,
    )

@router.post("/detect-burnout", response_model=BurnoutDetectionResponse)
async def detect_burnout(
    payload: BurnoutDetectionRequest,
    uid: str = Depends(verify_firebase_token)
):
    user_id = payload.userId or uid or "default_user"
    return MLService.detect_burnout_and_anomalies(
        user_id=user_id,
        recent_daily_stats=payload.recentDailyStats,
        recent_tasks=payload.recentTasks,
        recent_events=payload.recentEvents,
    )

@router.post("/forecast-productivity", response_model=ProductivityForecastResponse)
async def forecast_productivity(
    payload: ProductivityForecastRequest,
    uid: str = Depends(verify_firebase_token)
):
    user_id = payload.userId or uid or "default_user"
    return MLService.forecast_productivity(
        user_id=user_id,
        historical_daily_stats=payload.historicalDailyStats,
        forecast_days_count=payload.forecastDaysCount,
    )

@router.post("/cluster-tasks", response_model=TaskSemanticClusterResponse)
async def cluster_tasks_semantically(
    payload: TaskSemanticClusterRequest,
    uid: str = Depends(verify_firebase_token)
):
    return MLService.cluster_tasks_semantically(
        tasks=payload.tasks,
        num_clusters=payload.numClusters,
    )

