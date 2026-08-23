import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from app.models import TelemetryEventRequest, TelemetryBatchRequest, TelemetryBatchResponse
from app.core.security import verify_firebase_token
from app.services.firestore_service import save_telemetry_event, save_telemetry_batch

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/telemetry", tags=["Telemetry"])

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
