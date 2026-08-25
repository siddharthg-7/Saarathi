from typing import Dict, List, Any, Optional
from app.models import FeatureMetadataModel

FEATURE_REGISTRY: Dict[str, Dict[str, Any]] = {
    "postpone_count": {
        "displayName": "Reschedule Frequency",
        "category": "behavioral_history",
        "description": "The number of times this specific task or task series has been postponed.",
        "unit": "count",
        "format": "integer",
        "positiveMeaning": "Zero postponements indicates high execution momentum.",
        "negativeMeaning": "Higher postponements strongly elevate procrastination likelihood.",
        "privacyLevel": "private",
    },
    "historical_completion_rate": {
        "displayName": "Historical Completion Rate",
        "category": "behavioral_history",
        "description": "Your percentage of successfully completed tasks in comparable conditions and time slots.",
        "unit": "percentage",
        "format": "percentage",
        "positiveMeaning": "High past completion rate increases predicted success.",
        "negativeMeaning": "Low historical completion rate in this window increases delay risk.",
        "privacyLevel": "private",
    },
    "time_of_day": {
        "displayName": "Scheduled Time Window",
        "category": "temporal",
        "description": "The hour of the day when the task is scheduled to begin.",
        "unit": "hour",
        "format": "time",
        "positiveMeaning": "Scheduled during your measured peak energy window (morning deep focus).",
        "negativeMeaning": "Scheduled late in the evening when mental fatigue is higher.",
        "privacyLevel": "private",
    },
    "day_of_week": {
        "displayName": "Day of the Week",
        "category": "temporal",
        "description": "The weekday on which the task is scheduled.",
        "unit": "weekday",
        "format": "text",
        "positiveMeaning": "Aligned with your highest productivity weekdays (Tue/Wed).",
        "negativeMeaning": "Scheduled on days with historically elevated postponement rates.",
        "privacyLevel": "private",
    },
    "task_duration": {
        "displayName": "Estimated Duration",
        "category": "task_attributes",
        "description": "Total estimated minutes required to complete the task.",
        "unit": "minutes",
        "format": "integer",
        "positiveMeaning": "Short, manageable duration (<= 30 min) reduces cognitive friction.",
        "negativeMeaning": "Long single sessions (> 90 min) without subtasks increase delay risk.",
        "privacyLevel": "private",
    },
    "task_priority": {
        "displayName": "Task Urgency & Priority",
        "category": "task_attributes",
        "description": "The assigned priority level (Low, Medium, High, Urgent).",
        "unit": "level",
        "format": "categorical",
        "positiveMeaning": "Clear moderate priority ensures steady pacing.",
        "negativeMeaning": "Urgent pressure under heavy workload can trigger avoidance postponement.",
        "privacyLevel": "private",
    },
    "energy_required": {
        "displayName": "Mental Energy Demand",
        "category": "task_attributes",
        "description": "The cognitive intensity required (Low, Medium, High).",
        "unit": "intensity",
        "format": "categorical",
        "positiveMeaning": "Energy demand matches your current circadian energy level.",
        "negativeMeaning": "High energy task placed in a low-energy afternoon or late evening window.",
        "privacyLevel": "private",
    },
    "deadline_distance_hours": {
        "displayName": "Deadline Proximity",
        "category": "temporal",
        "description": "Remaining hours before the stated deadline expires.",
        "unit": "hours",
        "format": "decimal",
        "positiveMeaning": "Adequate lead time allows thorough focus.",
        "negativeMeaning": "Overdue or imminent deadline under 12 hours causes acute bottleneck.",
        "privacyLevel": "private",
    },
    "notification_snooze_count": {
        "displayName": "Reminder Snooze Rate",
        "category": "telemetry_context",
        "description": "Frequency of snoozing scheduled notification prompts.",
        "unit": "count",
        "format": "integer",
        "positiveMeaning": "Prompt response to reminders indicates active engagement.",
        "negativeMeaning": "Multiple snoozes indicate current distraction or contextual mismatch.",
        "privacyLevel": "private",
    },
    "recent_focus_duration": {
        "displayName": "Preceding Focus Volume",
        "category": "energy_workload",
        "description": "Accumulated deep focus minutes in the preceding 3-4 hours.",
        "unit": "minutes",
        "format": "integer",
        "positiveMeaning": "Fresh mental state with appropriate breaks.",
        "negativeMeaning": "Excessive continuous focus (> 4 hours) induces cognitive fatigue.",
        "privacyLevel": "private",
    },
}

def get_feature_metadata(feature_name: str) -> FeatureMetadataModel:
    entry = FEATURE_REGISTRY.get(feature_name)
    if entry:
        return FeatureMetadataModel(
            feature=feature_name,
            displayName=entry["displayName"],
            category=entry["category"],
            description=entry["description"],
            unit=entry.get("unit"),
            format=entry.get("format"),
            positiveMeaning=entry.get("positiveMeaning"),
            negativeMeaning=entry.get("negativeMeaning"),
            privacyLevel=entry.get("privacyLevel", "private")
        )
    return FeatureMetadataModel(
        feature=feature_name,
        displayName=feature_name.replace("_", " ").title(),
        category="general",
        description=f"Behavioral feature tracking {feature_name}.",
        unit=None,
        format=None,
        positiveMeaning=None,
        negativeMeaning=None,
        privacyLevel="private"
    )

def list_all_feature_metadata() -> List[FeatureMetadataModel]:
    return [get_feature_metadata(f) for f in FEATURE_REGISTRY.keys()]
