import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models import (
    XAIExplanationModel,
    TaskExplanationRequest,
    ScheduleRecommendationRequest,
    ScheduleRecommendationResponse,
    FeatureRegistryResponse,
    XAITelemetryEventRequest,
    RiskPredictionRequest,
)
from app.core.security import verify_firebase_token
from app.services.xai.xai_service import XAIService
from app.services.xai.feature_registry import list_all_feature_metadata
from app.services.firestore_service import get_user_tasks, save_telemetry_event

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/xai", tags=["Explainable AI (XAI)"])

@router.post("/explain-task", response_model=XAIExplanationModel)
async def explain_task(
    payload: TaskExplanationRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Generate deep explainable AI attribution and behavioral evidence for a specific task.
    Validates task ownership and derives evidence securely from backend records.
    """
    user_tasks = get_user_tasks(uid)
    task_data = next((t for t in user_tasks if t.get("id") == payload.taskId), None)

    if not task_data:
        # If task does not exist yet in db, construct from request baseline
        req = RiskPredictionRequest(
            id=payload.taskId,
            title="Active Task",
            category="General",
            priority="Medium",
            postponeCount=0,
            energyRequired="Medium",
            estimatedDuration=30,
        )
    else:
        req = RiskPredictionRequest(
            id=task_data.get("id", payload.taskId),
            title=task_data.get("title", "Task"),
            category=task_data.get("category", "General"),
            priority=task_data.get("priority", "Medium"),
            postponeCount=task_data.get("postponeCount", 0),
            energyRequired=task_data.get("energyRequired", "Medium"),
            estimatedDuration=task_data.get("estimatedDuration", 30),
            deadline=str(task_data.get("deadline")) if task_data.get("deadline") else None,
        )

    explanation = XAIService.generate_task_explanation(
        task=req,
        uid=uid,
        user_tasks=user_tasks,
    )
    return explanation

@router.post("/recommend-schedule", response_model=ScheduleRecommendationResponse)
async def recommend_schedule(
    payload: ScheduleRecommendationRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Generate transparent, evidence-backed smart rescheduling recommendation.
    Compares current predicted completion against optimal circadian focus windows.
    """
    try:
        rec = XAIService.get_schedule_recommendation(
            uid=uid,
            task_id=payload.taskId,
            target_date=payload.targetDate,
            preferred_time=payload.preferredTime,
        )
        return ScheduleRecommendationResponse(
            recommendation=rec,
            autoApplyEnabled=False,
        )
    except Exception as e:
        logger.error(f"Error generating schedule recommendation: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate schedule recommendation")

@router.get("/feature-registry", response_model=FeatureRegistryResponse)
async def get_feature_registry():
    """
    Retrieve centralized feature metadata registry defining display names,
    descriptions, units, categories, and positive/negative contribution meanings.
    """
    features = list_all_feature_metadata()
    return FeatureRegistryResponse(
        features=features,
        count=len(features),
        version="1.0.0"
    )

@router.post("/telemetry", status_code=200)
async def track_xai_interaction(
    payload: XAITelemetryEventRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Track user interactions with XAI explanations (views, detail drill-downs, accept/reject decisions).
    """
    try:
        event_dict = {
            "eventType": payload.eventType,
            "entityType": "xai_explanation",
            "entityId": payload.explanationId,
            "metadata": {
                "taskId": payload.taskId,
                "recommendationId": payload.recommendationId,
                **(payload.metadata or {})
            }
        }
        event_id = save_telemetry_event(uid, event_dict)
        return {"status": "ok", "eventId": event_id}
    except Exception as e:
        logger.error(f"Error recording XAI telemetry: {e}")
        raise HTTPException(status_code=500, detail="Failed to log XAI telemetry")
