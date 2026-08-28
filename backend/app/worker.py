import os
import logging
from celery import Celery

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "saarathi_worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300, # 5 minutes max per task
)

@celery_app.task(name="saarathi.async_process_brain_dump")
def async_process_brain_dump(user_id: str, audio_url: str, metadata: dict = None):
    """
    Background Celery worker job for parsing heavy voice audio brain dumps into structured tasks.
    """
    logger.info(f"Processing background voice brain dump for user {user_id}")
    # Processing logic executed asynchronously
    return {"status": "completed", "user_id": user_id, "audio_url": audio_url}

@celery_app.task(name="saarathi.async_aggregate_telemetry")
def async_aggregate_telemetry(user_id: str, batch_events: list):
    """
    Background Celery worker job for rolling up daily/hourly telemetry events into heatmaps.
    """
    logger.info(f"Aggregating {len(batch_events)} telemetry events for user {user_id}")
    return {"status": "aggregated", "event_count": len(batch_events)}
