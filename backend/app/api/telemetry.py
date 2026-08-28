import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, Optional
from app.models import TelemetryEventRequest, TelemetryBatchRequest, TelemetryBatchResponse
from app.core.security import verify_firebase_token
from app.core.rate_limiter import rate_limit, RateLimitTier
from app.services.firestore_service import (
    save_telemetry_event,
    save_telemetry_batch,
    get_user_telemetry_paginated,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/telemetry", tags=["Telemetry"], dependencies=[Depends(rate_limit(RateLimitTier.TELEMETRY))])

@router.get("/events", status_code=status.HTTP_200_OK)
async def get_events_paginated(
    eventType: Optional[str] = Query(None, description="Filter by specific event type"),
    pageSize: int = Query(50, ge=1, le=100, description="Page size limit (max 100)"),
    cursor: Optional[str] = Query(None, description="Cursor ID to start after"),
    uid: str = Depends(verify_firebase_token)
):
    """
    Retrieve telemetry events using cursor-based pagination
    """
    try:
        return get_user_telemetry_paginated(uid, event_type=eventType, page_size=pageSize, last_id=cursor)
    except Exception as e:
        logger.error(f"Error fetching paginated telemetry events: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch telemetry events")

@router.post("/event", status_code=status.HTTP_200_OK)
@router.post("/events", status_code=status.HTTP_200_OK)
async def receive_event(
    event: TelemetryEventRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Ingest a single strongly typed telemetry event
    """
    try:
        data = event.model_dump(exclude_none=True)
        event_id = save_telemetry_event(uid, data)
        return {"status": "ok", "eventId": event_id}
    except Exception as e:
        logger.error(f"Error saving telemetry event: {e}")
        raise HTTPException(status_code=500, detail="Failed to save telemetry event")

@router.post("/batch", response_model=TelemetryBatchResponse, status_code=status.HTTP_200_OK)
async def receive_batch(
    payload: TelemetryBatchRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Ingest a batch of up to 100 telemetry events with deduplication
    """
    if len(payload.events) > 100:
        raise HTTPException(status_code=400, detail="Batch size exceeds maximum limit of 100 events")

    try:
        events_dicts = [e.model_dump(exclude_none=True) for e in payload.events]
        processed = save_telemetry_batch(uid, events_dicts)
        return TelemetryBatchResponse(status="ok", processed=processed, failed=len(payload.events) - processed)
    except Exception as e:
        logger.error(f"Error processing telemetry batch: {e}")
        raise HTTPException(status_code=500, detail="Failed to process telemetry batch")
