from pydantic import BaseModel
from typing import List, Optional

class RiskPredictionRequest(BaseModel):
    id: str
    title: str
    category: str
    postponeCount: int = 0
    energyRequired: Optional[str] = "Medium"
    difficulty: Optional[int] = 3

class RiskPredictionResponse(BaseModel):
    taskId: str
    skipProbability: float
    delayProbability: float
    highRisk: bool

class TelemetryEventRequest(BaseModel):
    taskId: Optional[str] = None
    eventType: str
    currentPostponeCount: Optional[int] = None
    timestamp: Optional[str] = None

class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str
