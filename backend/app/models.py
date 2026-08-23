from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

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

class TelemetryEventModel(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    eventType: str
    timestamp: Optional[str] = None
    timezone: Optional[str] = "Asia/Kolkata"
    platform: Optional[str] = "web"
    sessionId: Optional[str] = None
    entityType: Optional[str] = "task"
    entityId: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    # Legacy support fields
    taskId: Optional[str] = None
    currentPostponeCount: Optional[int] = None

class TelemetryEventRequest(TelemetryEventModel):
    pass

class TelemetryBatchRequest(BaseModel):
    events: List[TelemetryEventModel]

class TelemetryBatchResponse(BaseModel):
    status: str
    processed: int
    failed: int = 0

class HourlyActivityModel(BaseModel):
    hour: int
    label: str
    tasksCompleted: int
    tasksStarted: int
    focusMinutes: int
    productivityScore: int
    completionRate: int

class DailyAnalyticsModel(BaseModel):
    userId: str
    date: str
    timezone: str
    tasksPlanned: int
    tasksCompleted: int
    tasksCompletedOnTime: int
    tasksOverdue: int
    tasksRescheduled: int
    completionRate: int
    focusMinutes: int
    focusSessions: int
    focusCompletionRate: int
    interruptionCount: int
    remindersSent: int
    remindersOpened: int
    remindersSnoozed: int
    remindersIgnored: int
    reminderResponseRate: int
    kairoSessions: int
    kairoMessages: int
    energyAverage: Optional[float] = None
    moodAverage: Optional[float] = None
    habitsCompleted: int
    habitsMissed: int
    habitCompletionRate: int
    productivityScore: int
    hourlyActivity: Optional[List[HourlyActivityModel]] = None

class WeekdayProductivityModel(BaseModel):
    dayIndex: int
    dayName: str
    shortName: str
    completedTasks: int
    plannedTasks: int
    completionRate: int
    focusMinutes: int
    averageTaskDurationMinutes: int
    rescheduleRate: int

class WeeklyComparisonModel(BaseModel):
    tasksCompletedChangePercent: float
    completionRateChangePercent: float
    focusMinutesChangePercent: float
    habitCompletionChangePercent: float

class WeeklyAnalyticsModel(BaseModel):
    userId: str
    weekId: str
    startDate: str
    endDate: str
    timezone: str
    weeklyTasksCompleted: int
    weeklyTasksPlanned: int
    weeklyCompletionRate: int
    weeklyFocusMinutes: int
    weeklyFocusSessions: int
    weeklyReminderResponseRate: int
    weeklyHabitCompletionRate: int
    weeklyRescheduleRate: int
    weeklyKairoUsage: int
    comparisonVsLastWeek: WeeklyComparisonModel
    bestObservedPeriod: Optional[str] = None
    mostRescheduledCategory: Optional[str] = None
    weekdayBreakdown: List[WeekdayProductivityModel]

class EnergyCorrelationModel(BaseModel):
    energyLevel: str
    tasksCount: int
    completionRate: int
    avgFocusMinutes: int
    description: str

class ReschedulingStatsModel(BaseModel):
    totalRescheduled: int
    rescheduleRate: int
    averageReschedulesPerTask: float
    mostRescheduledCategory: Optional[str] = None
    mostRescheduledWeekday: Optional[str] = None
    mostRescheduledHour: Optional[int] = None
    categoryBreakdown: List[Dict[str, Any]]

class KairoAnalyticsStatsModel(BaseModel):
    totalSessions: int
    totalMessages: int
    avgMessagesPerSession: float
    avgResponseLatencyMs: int
    tasksCreatedViaKairo: int
    tasksModifiedViaKairo: int
    brainDumpsProcessed: int
    recommendationsShown: int
    recommendationsAccepted: int
    recommendationsRejected: int
    recommendationAcceptanceRate: int

class MonthlyComparisonModel(BaseModel):
    tasksCompletedChangePercent: float
    completionRateChangePercent: float
    focusMinutesChangePercent: float

class MonthlyAnalyticsModel(BaseModel):
    userId: str
    monthId: str
    startDate: str
    endDate: str
    timezone: str
    totalCompletedTasks: int
    totalPlannedTasks: int
    completionRate: int
    focusMinutes: int
    focusSessions: int
    habitConsistencyRate: int
    reminderResponseRate: int
    reschedulingRate: int
    kairoTotalInteractions: int
    energyPatterns: List[EnergyCorrelationModel]
    reschedulingStats: ReschedulingStatsModel
    kairoStats: KairoAnalyticsStatsModel
    comparisonVsLastMonth: MonthlyComparisonModel
    descriptiveInsights: List[str]

class MLBehavioralFeatureModel(BaseModel):
    userId: str
    taskId: Optional[str] = None
    taskCategory: str
    priority: str
    estimatedDuration: int
    actualDuration: Optional[int] = None
    dayOfWeek: int
    hourOfDay: int
    energyLevel: Optional[str] = "Medium"
    moodLevel: Optional[str] = "neutral"
    notificationCount: int
    snoozeCount: int
    rescheduleCount: int
    previousCompletionRate: int
    timeToStartMinutes: Optional[int] = 15
    timeToCompletionMinutes: Optional[int] = 30
    deadlineDistanceHours: Optional[float] = None
    focusMinutesPreceding: Optional[int] = 25
    outcomeTarget: str

class MLDatasetResponse(BaseModel):
    features: List[MLBehavioralFeatureModel]
    count: int

class MoodEnergyLogRequest(BaseModel):
    energy: Optional[str] = None # "low" | "medium" | "high"
    mood: Optional[str] = None   # "very_low" | "low" | "neutral" | "good" | "very_good"
    source: Optional[str] = "manual"
    notes: Optional[str] = None

class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str
