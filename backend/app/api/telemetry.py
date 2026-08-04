from fastapi import APIRouter
from app.models import TelemetryEventRequest

router = APIRouter(prefix="/v1/telemetry", tags=["Telemetry"])

@router.post("/event")
async def receive_event(event: TelemetryEventRequest):
    # For now, just accept the event and do nothing, avoiding 404s.
    return {"status": "ok"}
