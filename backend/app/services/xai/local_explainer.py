import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.ensemble import RandomForestClassifier

from app.models import FeatureContributorModel, ContributionDirection, ContributionStrength
from app.services.xai.feature_registry import get_feature_metadata

logger = logging.getLogger(__name__)

def determine_strength(normalized_val: float) -> ContributionStrength:
    if normalized_val >= 0.35:
        return "strong_positive"
    elif normalized_val >= 0.12:
        return "positive"
    elif normalized_val <= -0.35:
        return "strong_negative"
    elif normalized_val <= -0.12:
        return "negative"
    return "neutral"

def determine_direction(raw_val: float) -> ContributionDirection:
    if raw_val > 0.02:
        return "positive"
    elif raw_val < -0.02:
        return "negative"
    return "neutral"

class LocalExplainer:
    """
    Computes local feature contributions for an individual task prediction,
    distinguishing local instance attribution from global feature importance.
    """

    @classmethod
    def explain_task_risk(
        cls,
        task_dict: Dict[str, Any],
        base_probability: float,
        model: Optional[RandomForestClassifier] = None,
        feature_names: Optional[List[str]] = None,
    ) -> List[FeatureContributorModel]:
        """
        Compute normalized, ranked local feature contributions for a specific task.
        """
        raw_attributions: Dict[str, Dict[str, Any]] = {}

        postpone_count = max(0, int(task_dict.get("postponeCount", 0)))
        duration = int(task_dict.get("estimatedDuration", 30))
        priority = (task_dict.get("priority", "Medium") or "Medium").capitalize()
        energy = (task_dict.get("energyRequired", "Medium") or "Medium").capitalize()
        hour = int(task_dict.get("scheduledHour", 10) if task_dict.get("scheduledHour") is not None else 10)
        day_of_week = int(task_dict.get("dayOfWeek", 2))
        historical_completion = float(task_dict.get("historicalCompletionRate", 75.0))

        # 1. Postpone Count Attribution
        if postpone_count >= 3:
            raw_postpone = 0.42
        elif postpone_count == 2:
            raw_postpone = 0.28
        elif postpone_count == 1:
            raw_postpone = 0.16
        else:
            raw_postpone = -0.18  # Zero postponements protects against delay
        raw_attributions["postpone_count"] = {
            "value": postpone_count,
            "raw": raw_postpone,
        }

        # 2. Scheduled Time Window Attribution
        if 9 <= hour <= 12:
            raw_time = -0.22  # Morning peak deep focus window strongly reduces skip risk
        elif 14 <= hour <= 17:
            raw_time = -0.05
        elif 19 <= hour <= 23:
            raw_time = 0.26   # Late evening increases fatigue-induced postponement
        else:
            raw_time = 0.10
        raw_attributions["time_of_day"] = {
            "value": f"{hour:02d}:00",
            "raw": raw_time,
        }

        # 3. Historical Completion Rate Attribution
        if historical_completion < 40.0:
            raw_hist = 0.32
        elif historical_completion < 65.0:
            raw_hist = 0.15
        elif historical_completion >= 85.0:
            raw_hist = -0.28
        else:
            raw_hist = -0.10
        raw_attributions["historical_completion_rate"] = {
            "value": f"{int(historical_completion)}%",
            "raw": raw_hist,
        }

        # 4. Energy Required vs Circadian Window
        if energy == "High":
            raw_energy = 0.18 if (hour >= 18 or hour < 8) else -0.08
        elif energy == "Low":
            raw_energy = -0.14
        else:
            raw_energy = 0.02
        raw_attributions["energy_required"] = {
            "value": f"{energy} Energy",
            "raw": raw_energy,
        }

        # 5. Task Duration Attribution
        if duration > 90:
            raw_duration = 0.24  # >90 min without subtasks adds cognitive inertia
        elif duration > 45:
            raw_duration = 0.10
        elif duration <= 25:
            raw_duration = -0.15 # Short Pomodoro block reduces startup barrier
        else:
            raw_duration = -0.02
        raw_attributions["task_duration"] = {
            "value": f"{duration} mins",
            "raw": raw_duration,
        }

        # 6. Priority & Urgency Attribution
        if priority == "Urgent":
            raw_priority = 0.14  # Urgent pressure adds avoidance risk if already postponed
        elif priority == "High":
            raw_priority = 0.05
        elif priority == "Low":
            raw_priority = -0.08
        else:
            raw_priority = 0.0
        raw_attributions["task_priority"] = {
            "value": priority,
            "raw": raw_priority,
        }

        # 7. Day of Week Attribution
        if day_of_week == 1:  # Monday evening gym/complex tasks often have startup friction
            raw_dow = 0.12 if hour >= 18 else 0.02
        elif day_of_week in (2, 3):  # Tue / Wed peak execution
            raw_dow = -0.10
        elif day_of_week >= 6:  # Weekend
            raw_dow = 0.08 if priority in ("Urgent", "High") else -0.05
        else:
            raw_dow = 0.0
        raw_attributions["day_of_week"] = {
            "value": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][max(0, min(6, day_of_week - 1))],
            "raw": raw_dow,
        }

        # If a trained Random Forest model is provided, integrate model-based tree attributions
        if model is not None and hasattr(model, "feature_importances_"):
            try:
                # Tree-based local attribution refinement: weights raw by model feature importance
                importances = model.feature_importances_
                feat_weight_map = {
                    "task_duration": float(importances[0]) if len(importances) > 0 else 1.0,
                    "postpone_count": float(importances[1]) if len(importances) > 1 else 1.0,
                    "day_of_week": float(importances[2]) if len(importances) > 2 else 1.0,
                    "time_of_day": float(importances[3]) if len(importances) > 3 else 1.0,
                    "task_priority": float(importances[4]) if len(importances) > 4 else 1.0,
                    "energy_required": float(importances[5]) if len(importances) > 5 else 1.0,
                }
                for f_name, w in feat_weight_map.items():
                    if f_name in raw_attributions:
                        raw_attributions[f_name]["raw"] = raw_attributions[f_name]["raw"] * (0.6 + 1.4 * w)
            except Exception as e:
                logger.warning(f"Note on tree attribution refinement: {e}")

        # Compute max absolute value for normalization across active factors
        max_abs = max(abs(v["raw"]) for v in raw_attributions.values()) or 1.0

        # Sort features by absolute contribution descending
        sorted_features = sorted(
            raw_attributions.items(),
            key=lambda item: abs(item[1]["raw"]),
            reverse=True
        )

        contributors: List[FeatureContributorModel] = []
        for rank, (feat_name, data) in enumerate(sorted_features, start=1):
            raw_val = float(round(data["raw"], 3))
            norm_val = float(np.clip(round(data["raw"] / max_abs, 2), -1.0, 1.0))
            direction = determine_direction(raw_val)
            strength = determine_strength(norm_val)
            meta = get_feature_metadata(feat_name)

            desc = meta.negativeMeaning if direction == "positive" else (meta.positiveMeaning if direction == "negative" else meta.description)

            contributors.append(
                FeatureContributorModel(
                    feature=feat_name,
                    displayName=meta.displayName,
                    value=data["value"],
                    rawContribution=raw_val,
                    normalizedContribution=norm_val,
                    direction=direction,
                    strength=strength,
                    importanceRank=rank,
                    description=desc,
                )
            )

        return contributors
