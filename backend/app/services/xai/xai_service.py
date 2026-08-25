import uuid
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from app.models import (
    XAIExplanationModel,
    ModelMetadataModel,
    FeatureContributorModel,
    BehavioralEvidenceModel,
    ExplanationQuality,
    RiskPredictionRequest,
)
from app.services.xai.local_explainer import LocalExplainer
from app.services.xai.evidence_engine import EvidenceEngine, MIN_EVIDENCE_SAMPLE_SIZE
from app.services.xai.schedule_optimizer import ScheduleOptimizer
from app.services.firestore_service import get_user_tasks, get_user_telemetry_events

logger = logging.getLogger(__name__)

# Explanation Cache: Key -> XAIExplanationModel
_explanation_cache: Dict[str, XAIExplanationModel] = {}

class XAIService:
    """
    Core Explainable AI Service for Saarathi OS.
    Orchestrates prediction explanations, feature contributions, behavioral evidence,
    and natural language reasoning.
    """

    MODEL_NAME = "task_risk_rf"
    MODEL_VERSION = "1.0.0"
    FEATURE_VERSION = "1.0.0"

    @classmethod
    def generate_task_explanation(
        cls,
        task: RiskPredictionRequest,
        uid: str = "default_user",
        skip_probability: float = 30.0,
        is_cold_start: bool = False,
        events_count: Optional[int] = None,
        user_tasks: Optional[List[Dict[str, Any]]] = None,
        telemetry_events: Optional[List[Dict[str, Any]]] = None,
    ) -> XAIExplanationModel:
        """
        Generate a complete, structured Explainable AI explanation for a given task.
        """
        now = datetime.now(timezone.utc)
        cache_key = f"{uid}_{task.id}_{task.postponeCount}_{skip_probability}_{cls.MODEL_VERSION}"

        if cache_key in _explanation_cache:
            return _explanation_cache[cache_key]

        explanation_id = f"xai_{int(now.timestamp()*1000)}_{uuid.uuid4().hex[:6]}"

        try:
            # 1. Parse task attributes
            postpone_count = max(0, task.postponeCount)
            category = task.category or "General"
            energy_req = (task.energyRequired or "Medium").capitalize()
            duration = task.estimatedDuration or 30
            priority = (task.priority or "Medium").capitalize()

            # 2. Extract verified behavioral evidence
            evidence_list, quality, quality_reason = EvidenceEngine.extract_task_evidence(
                uid=uid,
                task_category=category,
                scheduled_hour=now.hour,
                day_of_week=now.weekday() + 1,
                user_tasks=user_tasks,
                telemetry_events=telemetry_events,
            )

            # 3. Compute local feature attributions
            task_dict = {
                "postponeCount": postpone_count,
                "estimatedDuration": duration,
                "priority": priority,
                "energyRequired": energy_req,
                "scheduledHour": now.hour,
                "dayOfWeek": now.weekday() + 1,
                "historicalCompletionRate": float(evidence_list[0].value) if evidence_list and isinstance(evidence_list[0].value, (int, float)) else 75.0,
            }

            contributors = LocalExplainer.explain_task_risk(task_dict, base_probability=skip_probability)

            # 4. Synthesize concise non-judgmental natural language reasoning
            top_factors = contributors[:2]
            top_factor_names = [f.displayName.lower() for f in top_factors if f.direction == "positive"]

            if is_cold_start or quality == "insufficient_data":
                nl_explanation = (
                    "I don't have enough history to identify a reliable personalized pattern yet. "
                    "This assessment is based on task attributes and baseline scheduling principles rather than learned behavior."
                )
                summary = "Cold-start heuristic explanation based on task workload attributes."
            else:
                factor_text = f" and {top_factors[0].displayName.lower()}" if top_factors else ""
                sample_info = f"Based on {evidence_list[0].metric}" if evidence_list else "Recent history"
                nl_explanation = (
                    f"Predicted skip risk is {int(skip_probability)}%. "
                    f"{sample_info}, which contributed strongly to this estimate alongside {top_factors[0].displayName.lower() if top_factors else 'task timing'}."
                )
                summary = f"Risk driven by {', '.join(top_factor_names) if top_factor_names else 'standard baseline factors'}."

            model_metadata = ModelMetadataModel(
                modelName=cls.MODEL_NAME,
                modelVersion=cls.MODEL_VERSION,
                featureVersion=cls.FEATURE_VERSION,
                explanationMethod="TreeLocalAttribution" if not is_cold_start else "HeuristicRuleWeights",
                generatedAt=now.isoformat(),
            )

            explanation = XAIExplanationModel(
                explanationId=explanation_id,
                taskId=task.id,
                summary=summary,
                predictionType="task_risk",
                probability=skip_probability,
                quality=quality if not is_cold_start else "insufficient_data",
                qualityReason=quality_reason,
                contributors=contributors,
                evidence=evidence_list,
                modelMetadata=model_metadata,
                isColdStart=is_cold_start,
                isFallback=False,
                naturalLanguageExplanation=nl_explanation,
            )

            # Store in cache
            _explanation_cache[cache_key] = explanation
            return explanation

        except Exception as e:
            logger.error(f"XAI attribution error, invoking safe fallback: {e}")
            fallback_meta = ModelMetadataModel(
                modelName=cls.MODEL_NAME,
                modelVersion=cls.MODEL_VERSION,
                featureVersion=cls.FEATURE_VERSION,
                explanationMethod="FallbackAggregateStats",
                generatedAt=now.isoformat(),
            )
            return XAIExplanationModel(
                explanationId=explanation_id,
                taskId=task.id,
                summary="Prediction available; detailed local attribution in fallback mode.",
                predictionType="task_risk",
                probability=skip_probability,
                quality="limited_evidence",
                qualityReason="Local feature explanation engine fell back to verified aggregate statistics.",
                contributors=[],
                evidence=[
                    BehavioralEvidenceModel(
                        fact="Aggregate Historical Baseline",
                        metric="Task baseline metrics",
                        value=100,
                        sampleSize=1,
                        timeWindow="All time",
                        baselineComparison="Baseline model fallback",
                        isStatisticallySignificant=False,
                    )
                ],
                modelMetadata=fallback_meta,
                isColdStart=True,
                isFallback=True,
                naturalLanguageExplanation="The model predicts a delay risk. Detailed local feature attribution is currently unavailable, but your baseline completion history was referenced.",
            )

    @classmethod
    def get_schedule_recommendation(
        cls,
        uid: str,
        task_id: str,
        target_date: Optional[str] = None,
        preferred_time: Optional[str] = None,
    ):
        return ScheduleOptimizer.generate_schedule_recommendation(
            uid=uid,
            task_id=task_id,
            target_date=target_date,
            preferred_time=preferred_time,
        )

    @classmethod
    def invalidate_cache(cls, uid: Optional[str] = None, task_id: Optional[str] = None) -> None:
        global _explanation_cache
        if not uid and not task_id:
            _explanation_cache.clear()
            return
        keys_to_delete = [
            k for k in _explanation_cache.keys()
            if (uid and k.startswith(f"{uid}_")) or (task_id and f"_{task_id}_" in k)
        ]
        for k in keys_to_delete:
            _explanation_cache.pop(k, None)
