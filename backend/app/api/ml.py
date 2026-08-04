from fastapi import APIRouter, Depends
from app.models import RiskPredictionRequest, RiskPredictionResponse
from app.core.security import verify_firebase_token

router = APIRouter(prefix="/v1/ml", tags=["Machine Learning"])

@router.post("/predict-risk", response_model=RiskPredictionResponse)
async def predict_task_risk(payload: RiskPredictionRequest, uid: str = Depends(verify_firebase_token)):
    skip_prob = min(95.0, payload.postponeCount * 25.0 + 10.0)
    delay_prob = min(90.0, payload.postponeCount * 20.0 + 15.0)
    high_risk = skip_prob >= 50.0

    return RiskPredictionResponse(
        taskId=payload.id,
        skipProbability=skip_prob,
        delayProbability=delay_prob,
        highRisk=high_risk,
    )
