import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, Optional
from app.core.security import verify_firebase_token
from app.models import (
    DailyAnalyticsModel,
    WeeklyAnalyticsModel,
    MonthlyAnalyticsModel,
    MLDatasetResponse,
    MoodEnergyLogRequest,
)
from app.services.analytics_service import (
    aggregate_daily,
    aggregate_weekly,
    aggregate_monthly,
    extract_ml_dataset,
)
from app.services.firestore_service import save_mood_energy_doc

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/analytics", tags=["Analytics"])

@router.get("/daily", response_model=DailyAnalyticsModel)
async def get_daily_analytics(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    timezone: str = Query("Asia/Kolkata", description="User IANA timezone identifier"),
    uid: str = Depends(verify_firebase_token)
):
    """
    Retrieve daily aggregated analytics
    """
    try:
        return aggregate_daily(uid, target_date=date, user_tz=timezone)
    except Exception as e:
        logger.error(f"Error fetching daily analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate daily analytics")

@router.get("/weekly", response_model=WeeklyAnalyticsModel)
async def get_weekly_analytics(
    weekId: Optional[str] = Query(None, description="Week ID in YYYY-Www format"),
    timezone: str = Query("Asia/Kolkata", description="User IANA timezone identifier"),
    uid: str = Depends(verify_firebase_token)
):
    """
    Retrieve weekly productivity report and comparisons
    """
    try:
        return aggregate_weekly(uid, week_id=weekId, user_tz=timezone)
    except Exception as e:
        logger.error(f"Error fetching weekly analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate weekly analytics")

@router.get("/monthly", response_model=MonthlyAnalyticsModel)
async def get_monthly_analytics(
    monthId: Optional[str] = Query(None, description="Month ID in YYYY-MM format"),
    timezone: str = Query("Asia/Kolkata", description="User IANA timezone identifier"),
    uid: str = Depends(verify_firebase_token)
):
    """
    Retrieve monthly insights and trend observations
    """
    try:
        return aggregate_monthly(uid, month_id=monthId, user_tz=timezone)
    except Exception as e:
        logger.error(f"Error fetching monthly analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate monthly analytics")

@router.get("/ml-dataset", response_model=MLDatasetResponse)
async def get_ml_dataset(
    limit: int = Query(100, ge=1, le=500, description="Max feature rows to export"),
    uid: str = Depends(verify_firebase_token)
):
    """
    Export structured behavioral feature vectors for Phase 9 ML model preparation
    """
    try:
        features = extract_ml_dataset(uid, limit=limit)
        return MLDatasetResponse(features=features, count=len(features))
    except Exception as e:
        logger.error(f"Error extracting ML dataset: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract ML features")

@router.post("/mood-energy", status_code=200)
async def log_mood_energy(
    payload: MoodEnergyLogRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Explicitly log user energy and mood
    """
    try:
        doc_data = save_mood_energy_doc(
            uid,
            energy=payload.energy,
            mood=payload.mood,
            source=payload.source or "manual",
            notes=payload.notes
        )
        return {"status": "ok", "log": doc_data}
    except Exception as e:
        logger.error(f"Error saving mood/energy log: {e}")
        raise HTTPException(status_code=500, detail="Failed to save mood and energy log")
