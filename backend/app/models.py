from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

# ==========================================
# XAI (EXPLAINABLE AI) CORE SCHEMAS
# ==========================================

ContributionDirection = Literal["positive", "negative", "neutral"]
ContributionStrength = Literal["strong_positive", "positive", "neutral", "negative", "strong_negative"]
ExplanationQuality = Literal["insufficient_data", "limited_evidence", "moderate_evidence", "strong_evidence"]

class FeatureContributorModel(BaseModel):
    feature: str
    displayName: str
    value: Any
    rawContribution: float  # e.g. local attribution / SHAP value
    normalizedContribution: float  # scale -1.0 to 1.0
    direction: ContributionDirection
    strength: ContributionStrength
    importanceRank: int
    description: Optional[str] = None

class BehavioralEvidenceModel(BaseModel):
    fact: str
    metric: str
    value: Any
    sampleSize: int
    timeWindow: Optional[str] = None
    baselineComparison: Optional[str] = None
    isStatisticallySignificant: bool = True

class ModelMetadataModel(BaseModel):
    modelName: str
    modelVersion: str = "1.0.0"
    featureVersion: str = "1.0.0"
    explanationMethod: str = "TreeLocalAttribution"
    generatedAt: Optional[str] = None

class XAIExplanationModel(BaseModel):
    explanationId: str
    taskId: str
    summary: str
    predictionType: str = "task_risk"  # "task_risk" | "task_completion" | "schedule_recommendation"
    probability: float  # 0 to 100 or 0.0 to 1.0
    quality: ExplanationQuality = "moderate_evidence"
    qualityReason: Optional[str] = None
    contributors: List[FeatureContributorModel] = Field(default_factory=list)
    evidence: List[BehavioralEvidenceModel] = Field(default_factory=list)
    modelMetadata: ModelMetadataModel
    isColdStart: bool = False
    isFallback: bool = False
    naturalLanguageExplanation: Optional[str] = None

class ScheduleTimeSlotModel(BaseModel):
    date: str
    time: str
    startHour: int
    endHour: int
    predictedCompletion: float  # 0 to 100

class ScheduleRecommendationModel(BaseModel):
    recommendationId: str
    taskId: str
    currentSchedule: ScheduleTimeSlotModel
    recommendedSchedule: ScheduleTimeSlotModel
    predictedImprovement: float  # difference in percentage points
    reason: str
    explanationQuality: ExplanationQuality = "moderate_evidence"
    contributors: List[FeatureContributorModel] = Field(default_factory=list)
    evidence: List[BehavioralEvidenceModel] = Field(default_factory=list)
    modelMetadata: ModelMetadataModel
    generatedAt: str

class ScheduleRecommendationRequest(BaseModel):
    taskId: str
    userId: Optional[str] = None
    targetDate: Optional[str] = None
    preferredTime: Optional[str] = None

class ScheduleRecommendationResponse(BaseModel):
    recommendation: ScheduleRecommendationModel
    autoApplyEnabled: bool = False

class TaskExplanationRequest(BaseModel):
    taskId: str
    userId: Optional[str] = None

class FeatureMetadataModel(BaseModel):
    feature: str
    displayName: str
    category: str
    description: str
    unit: Optional[str] = None
    format: Optional[str] = None
    positiveMeaning: Optional[str] = None
    negativeMeaning: Optional[str] = None
    privacyLevel: str = "private"

class FeatureRegistryResponse(BaseModel):
    features: List[FeatureMetadataModel]
    count: int
    version: str = "1.0.0"

class XAITelemetryEventRequest(BaseModel):
    eventType: Literal[
        "xai_explanation_shown",
        "xai_details_opened",
        "recommendation_accepted",
        "recommendation_rejected",
        "recommendation_ignored"
    ]
    explanationId: str
    taskId: Optional[str] = None
    recommendationId: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

# ==========================================
# PHASE 9 & 10 PREDICTION SCHEMAS
# ==========================================

class RiskPredictionRequest(BaseModel):
    id: str
    title: str
    category: Optional[str] = "General"
    priority: Optional[str] = "Medium"
    postponeCount: int = 0
    energyRequired: Optional[str] = "Medium"
    difficulty: Optional[int] = 3
    estimatedDuration: Optional[int] = 30
    deadline: Optional[str] = None
    createdAt: Optional[str] = None

class RiskPredictionResponse(BaseModel):
    taskId: str
    skipProbability: float
    delayProbability: float
    completionProbability: float = 70.0
    highRisk: bool
    riskLevel: str = "medium"  # "low" | "medium" | "high" | "critical"
    contributingFactors: List[str] = Field(default_factory=list)
    recommendedAction: Optional[str] = None
    isColdStart: bool = True
    # XAI Extensions
    explanation: Optional[XAIExplanationModel] = None
    modelMetadata: Optional[ModelMetadataModel] = None

class BatchRiskPredictionRequest(BaseModel):
    tasks: List[RiskPredictionRequest]
    userId: Optional[str] = None
    eventsCount: Optional[int] = None

class BatchRiskPredictionResponse(BaseModel):
    predictions: List[RiskPredictionResponse]
    highRiskCount: int
    isColdStart: bool = True
    modelMetadata: Optional[ModelMetadataModel] = None

class OptimalTimeSlotModel(BaseModel):
    dayOfWeek: int
    dayName: str
    startHour: int
    endHour: int
    label: str
    energyFit: str  # "high" | "medium" | "low"
    averageProductivityScore: int

class EnergyClusterModel(BaseModel):
    clusterId: int
    name: str  # e.g., "Peak Deep Work", "Afternoon Execution", "Evening Wind Down"
    hours: List[int]
    averageProductivityScore: float
    averageFocusMinutes: float
    recommendedEnergyType: str

class EnergyClusterRequest(BaseModel):
    userId: Optional[str] = None
    hourlyStats: Optional[List[Dict[str, Any]]] = None
    events: Optional[List[Dict[str, Any]]] = None

class EnergyClusterResponse(BaseModel):
    userId: str
    clusters: List[EnergyClusterModel]
    optimalTimeSlots: List[OptimalTimeSlotModel]
    dominantPeakHour: int
    isColdStart: bool = True

class BurnoutDetectionRequest(BaseModel):
    userId: Optional[str] = None
    recentDailyStats: Optional[List[Dict[str, Any]]] = None
    recentTasks: Optional[List[Dict[str, Any]]] = None
    recentEvents: Optional[List[Dict[str, Any]]] = None

class BurnoutDetectionResponse(BaseModel):
    userId: str
    burnoutRiskScore: float  # 0 to 100
    anomalyDetected: bool
    riskLevel: str  # "low" | "moderate" | "high"
    contributingIndicators: List[str]
    workloadTrend: str  # "increasing" | "stable" | "decreasing"
    recommendations: List[str]
    isColdStart: bool = True

class DailyForecastModel(BaseModel):
    date: str
    dayOfWeek: int
    dayName: str
    predictedTasksCompleted: int
    predictedFocusMinutes: int
    confidenceLower: float
    confidenceUpper: float

class ProductivityForecastRequest(BaseModel):
    userId: Optional[str] = None
    historicalDailyStats: Optional[List[Dict[str, Any]]] = None
    forecastDaysCount: int = 7

class ProductivityForecastResponse(BaseModel):
    userId: str
    forecastDays: List[DailyForecastModel]
    expectedWeeklyCompleted: int
    expectedWeeklyFocusMinutes: int
    trendDirection: str  # "upward" | "steady" | "downward"
    isColdStart: bool = True

class TaskClusterItemModel(BaseModel):
    id: str
    title: str
    category: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)

class TaskSemanticClusterRequest(BaseModel):
    tasks: List[TaskClusterItemModel]
    numClusters: Optional[int] = None

class TaskClusterModel(BaseModel):
    clusterId: int
    topicName: str
    keywords: List[str]
    taskIds: List[str]
    taskCount: int

class TaskSemanticClusterResponse(BaseModel):
    clusters: List[TaskClusterModel]
    totalTasks: int

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

# -------------------------------------------------------------
# Phase 11 — Long-Term Memory & Hybrid Semantic Retrieval Models
# -------------------------------------------------------------

MemorySourceType = Literal[
    'kairo_chat',
    'note',
    'brain_dump',
    'goal',
    'task',
    'task_history',
    'analytics_insight',
    'user_preference'
]

class MemoryMetadataModel(BaseModel):
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    sourceId: Optional[str] = None
    taskId: Optional[str] = None
    goalId: Optional[str] = None
    projectId: Optional[str] = None
    date: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = "en"
    importance: Optional[float] = None

class MemoryItemModel(BaseModel):
    id: str
    userId: str
    sourceType: MemorySourceType
    sourceId: Optional[str] = None
    content: str
    summary: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    importance: float = 0.5
    confidence: float = 1.0
    contentHash: Optional[str] = None
    embeddingModel: str = "all-MiniLM-L6-v2"
    embeddingVersion: str = "1.0.0"
    createdAt: str
    updatedAt: str
    lastAccessedAt: Optional[str] = None
    validFrom: Optional[str] = None
    validUntil: Optional[str] = None
    isActive: bool = True
    deletedAt: Optional[str] = None

class MemoryCreateRequest(BaseModel):
    sourceType: MemorySourceType
    sourceId: Optional[str] = None
    content: str
    summary: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    importance: float = 0.5
    confidence: float = 1.0
    validFrom: Optional[str] = None
    validUntil: Optional[str] = None

class MemoryUpdateRequest(BaseModel):
    content: Optional[str] = None
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    importance: Optional[float] = None
    isActive: Optional[bool] = None

class MemorySearchFilter(BaseModel):
    sourceType: Optional[MemorySourceType] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    minImportance: Optional[float] = None
    isActive: Optional[bool] = True

class MemorySearchRequest(BaseModel):
    query: str
    filter: Optional[MemorySearchFilter] = None
    matchThreshold: float = 0.3
    matchCount: int = 10
    semanticWeight: float = 0.7
    keywordWeight: float = 0.3

class HybridSearchResultItem(BaseModel):
    memoryId: str
    userId: str
    sourceType: MemorySourceType
    sourceId: Optional[str] = None
    content: str
    summary: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    importance: float
    confidence: float
    semanticScore: float
    keywordScore: float
    hybridScore: float
    createdAt: str

class MemorySearchResponse(BaseModel):
    query: str
    results: List[HybridSearchResultItem]
    totalMatches: int
    retrievalLatencyMs: int

class MemoryStatsResponse(BaseModel):
    totalMemories: int
    activeMemories: int
    countsBySource: Dict[str, int]
    embeddingModel: str
    dimensions: int
