# Phase 8 — Saarathi Analytics Engine & Behavioral Telemetry

You are continuing development of **Saarathi**, an AI-powered personal productivity operating system.

The AI assistant is called **Kairo**.

Phase 7 — Notification & Smart Reminder Engine — has already been implemented and verified.

Do NOT rebuild Phase 7.

Do NOT replace the existing architecture.

Do NOT create duplicate telemetry systems.

Your task is to implement and complete **Phase 8 — Analytics Engine & Behavioral Telemetry** on top of the existing Saarathi codebase.

---

# 1. CURRENT PROJECT STATE

The project already contains:

### Frontend

* React web application
* React Native + Expo mobile application
* Existing Analytics View
* Existing task management
* Existing focus/task UI
* Existing notification system
* Existing Kairo UI
* Existing mood/energy concepts where applicable

### Backend

* FastAPI
* Existing telemetry API:
  `backend/app/api/telemetry.py`

### Shared API

* Existing telemetry client:
  `packages/api/src/telemetryApi.ts`

### Analytics UI

* Existing:
  `AnalyticsView.tsx`

### Database

* Firebase Authentication
* Firestore
* Existing user/task/reminder/notification structures

Phase 7 already introduced notification telemetry concepts.

---

# 2. PRIMARY OBJECTIVE

Build a reliable analytics engine that answers:

> "How does this user actually work?"

Saarathi should be able to measure:

* task completion
* task velocity
* task delays
* focus duration
* productivity by hour
* productivity by weekday
* notification behavior
* Kairo usage
* mood
* energy
* habit consistency
* procrastination patterns
* rescheduling behavior

Then transform those raw events into:

* daily summaries
* weekly reports
* monthly insights
* productivity graphs
* heatmaps
* trend analysis

Do not make unsupported psychological or medical claims.

Analytics should describe observed behavior rather than diagnose the user.

---

# 3. IMPORTANT ARCHITECTURAL PRINCIPLE

Separate:

```text
RAW TELEMETRY
```

from:

```text
DERIVED ANALYTICS
```

and:

```text
AI/ML PREDICTIONS
```

Architecture:

```text
User Activity
      ↓
Telemetry Events
      ↓
Raw Event Storage
      ↓
Aggregation
      ↓
Analytics Metrics
      ↓
Charts / Reports
      ↓
Future ML
```

Do not store calculated metrics as if they were raw events.

---

# 4. TELEMETRY EVENT MODEL

Create a strongly typed telemetry event model.

Suggested structure:

```ts
TelemetryEvent {
  id
  userId
  eventType
  timestamp
  timezone
  platform
  sessionId
  entityType
  entityId
  metadata
  createdAt
}
```

`metadata` must be structured and typed where possible.

Avoid using unstructured arbitrary JSON everywhere.

---

# 5. EVENT TYPES

Create a centralized event taxonomy.

## Task Events

```text
task_created
task_started
task_completed
task_cancelled
task_deleted
task_rescheduled
task_postponed
task_snoozed
task_reopened
task_overdue
```

## Focus Events

```text
focus_started
focus_paused
focus_resumed
focus_completed
focus_abandoned
focus_interrupted
```

## Reminder Events

Integrate with the Phase 7 notification engine.

```text
reminder_scheduled
reminder_sent
reminder_opened
reminder_ignored
reminder_snoozed
reminder_completed
reminder_dismissed
reminder_cancelled
```

Do not duplicate the notification system.

Reuse the existing Phase 7 notification event infrastructure where possible.

## Energy Events

```text
energy_logged
```

Values:

```text
low
medium
high
```

## Mood Events

```text
mood_logged
```

Use a simple controlled vocabulary rather than arbitrary free text.

Example:

```text
very_low
low
neutral
good
very_good
```

## Habit Events

```text
habit_created
habit_completed
habit_missed
habit_skipped
habit_rescheduled
```

## Kairo Events

```text
kairo_session_started
kairo_message_sent
kairo_response_received
kairo_task_created
kairo_task_modified
kairo_brain_dump_started
kairo_brain_dump_completed
kairo_recommendation_shown
kairo_recommendation_accepted
kairo_recommendation_rejected
```

Do NOT store the entire private conversation as telemetry.

Store only analytics metadata necessary to understand interaction behavior.

## Navigation / Product Events

Use sparingly.

Examples:

```text
analytics_view_opened
focus_view_opened
task_view_opened
```

Do not track every UI click.

---

# 6. EVENT DEDUPLICATION

Telemetry must be idempotent.

Network retries must not create duplicate events.

Each event should have a deterministic or client-generated unique ID.

Example:

```text
eventId
```

Before creating duplicate events, ensure the same event is not written twice.

This is particularly important for:

* offline events
* reconnect events
* mobile app restarts
* Firestore retry behavior
* HTTP retry behavior

---

# 7. OFFLINE-FIRST TELEMETRY

Saarathi must continue collecting telemetry when offline.

Example:

```text
User completes task
        ↓
No internet
        ↓
Store event locally
        ↓
Internet returns
        ↓
Upload telemetry
        ↓
Mark event synchronized
```

Do NOT lose behavioral data merely because the user was offline.

Create an event queue where appropriate.

The queue must support:

```text
pending
syncing
synced
failed
```

Implement retry with exponential backoff.

Avoid infinite retry loops.

---

# 8. PRIVACY

Telemetry must follow data minimization.

Do NOT collect:

* passwords
* authentication tokens
* API keys
* unnecessary private message content
* raw voice recordings as analytics metadata
* sensitive personal information unrelated to productivity analytics

For Kairo interactions, track:

```text
message type
session duration
response latency
tool usage
task creation
recommendation interaction
```

rather than storing the entire conversation as telemetry.

---

# 9. TASK COMPLETION METRICS

Implement:

### Completion Rate

```text
completed tasks / planned tasks × 100
```

Define "planned task" consistently.

Do not count deleted tasks as completed or failed unless explicitly recorded.

### Completion Velocity

Measure:

```text
tasks completed / day
tasks completed / week
tasks completed / month
```

### Completion Time

Track:

```text
task started
        ↓
task completed
```

Calculate:

```text
completionDuration
```

### On-Time Completion

Compare task completion with its due time.

Track:

```text
completed_on_time
completed_late
```

Do not use arbitrary client-clock comparisons when server timestamps are available.

---

# 10. TASK VELOCITY

Implement productivity velocity.

Examples:

```text
Tasks completed today
Tasks completed this week
Average tasks/day
7-day velocity
30-day velocity
```

Do not equate a higher task count automatically with higher productivity.

Provide contextual metrics.

Example:

```text
Tasks completed: 12
Average completion time: 34 min
Focus time: 4h 20m
```

---

# 11. FOCUS TELEMETRY

Integrate with the existing Focus/Pomodoro system.

Record:

```text
focus_started
focus_paused
focus_resumed
focus_completed
focus_abandoned
focus_interrupted
```

Track:

```text
plannedDuration
actualDuration
pauseDuration
interruptionCount
completionStatus
taskId
```

Calculate:

### Total Focus Time

```text
sum(actual focus duration)
```

### Average Focus Session

```text
total focus duration / number of completed sessions
```

### Focus Completion Rate

```text
completed focus sessions /
started focus sessions
```

Do not count paused time as active focus time.

---

# 12. PRODUCTIVITY BY HOUR

Aggregate activity into hourly buckets.

Example:

```text
00:00
01:00
02:00
...
23:00
```

Calculate useful metrics such as:

```text
tasks completed
focus minutes
tasks started
completion rate
```

Do not simply define the "best hour" from task count alone.

Use a transparent metric.

Example:

```text
Productivity Score =
normalized completion rate
+
normalized focus time
+
on-time completion
```

Document the exact formula.

---

# 13. PRODUCTIVITY BY WEEKDAY

Calculate:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

Metrics:

* completion rate
* completed tasks
* focus minutes
* average task duration
* reschedule rate

Allow the user to identify patterns without presenting them as absolute truths.

Example:

> Your highest average completion rate has occurred on Tuesday over the last 4 weeks.

Avoid:

> Tuesday is your objectively most productive day.

---

# 14. NOTIFICATION INTERACTION ANALYTICS

Integrate with Phase 7.

Track:

```text
sent
opened
ignored
snoozed
dismissed
completed
```

Calculate:

### Reminder Response Rate

```text
opened / delivered
```

### Reminder Completion Rate

```text
completed after reminder /
reminders delivered
```

### Snooze Rate

```text
snoozed / delivered
```

### Ignore Rate

```text
ignored / delivered
```

These metrics will later become features for the Phase 9 procrastination model.

---

# 15. AI / KAIRO ANALYTICS

Track Kairo usage without storing private conversation content unnecessarily.

Metrics:

```text
Kairo sessions
messages per session
average response latency
tasks created through Kairo
tasks modified through Kairo
brain dumps processed
recommendations shown
recommendations accepted
recommendations rejected
```

Calculate:

```text
Recommendation Acceptance Rate
```

```text
accepted recommendations /
recommendations shown
```

Track latency:

```text
request timestamp
response timestamp
```

Use this to identify slow AI workflows.

---

# 16. MOOD & ENERGY LOGGING

Implement simple daily logging.

Energy:

```text
low
medium
high
```

Mood:

```text
very_low
low
neutral
good
very_good
```

Store:

```text
timestamp
timezone
energy
mood
source
```

Source can be:

```text
manual
kairo
daily_checkin
```

Do not automatically infer mood from private conversations in Phase 8.

Only use explicit user-provided values.

---

# 17. ENERGY CORRELATION

Calculate descriptive correlations.

Example:

```text
Energy = High
Average completion rate = 82%

Energy = Medium
Average completion rate = 67%

Energy = Low
Average completion rate = 48%
```

Important:

Use language such as:

> Tasks completed during your high-energy periods have had a higher completion rate.

Do NOT claim:

> Low energy causes procrastination.

Correlation is not causation.

---

# 18. HABIT STREAKS

Implement reliable streak calculation.

Track:

```text
currentStreak
longestStreak
completionRate
missedDays
skippedDays
```

Handle:

* daily habits
* weekly habits
* scheduled days
* skipped days
* deleted habits

Do not break a streak incorrectly because of timezone differences.

Use the user's configured IANA timezone.

---

# 19. RESCHEDULING ANALYTICS

Track:

```text
task_rescheduled
task_postponed
task_snoozed
```

Calculate:

```text
average reschedules/task
reschedule rate
most rescheduled categories
most rescheduled weekdays
most rescheduled hours
```

Example:

> Coding tasks were rescheduled more frequently than your other task categories over the last 30 days.

Do not call this "procrastination" yet.

Phase 9 will build the actual behavioral model.

---

# 20. PROCRASTINATION SIGNAL DATASET

Phase 8 should collect the features required for future ML.

Do NOT train the model yet.

Potential future features:

```text
taskCategory
priority
estimatedDuration
actualDuration
dayOfWeek
hourOfDay
energy
mood
notificationCount
snoozeCount
rescheduleCount
previousCompletionRate
timeToStart
timeToCompletion
deadlineDistance
focusHistory
```

Create a consistent feature schema.

Phase 9 will consume this dataset.

---

# 21. DAILY ANALYTICS AGGREGATION

Create a daily aggregation model.

Example:

```text
DailyAnalytics {
  userId
  date
  timezone

  tasksPlanned
  tasksCompleted
  tasksCompletedOnTime
  tasksOverdue

  focusMinutes
  focusSessions
  focusCompletionRate

  remindersSent
  remindersOpened
  remindersSnoozed
  remindersIgnored

  kairoSessions
  kairoMessages

  energyAverage
  moodAverage

  habitsCompleted
  habitsMissed

  tasksRescheduled
}
```

Do not calculate this object separately in every UI component.

Create a centralized analytics aggregation layer.

---

# 22. WEEKLY ANALYTICS

Aggregate daily analytics into weekly metrics.

Include:

```text
weeklyTasksCompleted
weeklyCompletionRate
weeklyFocusMinutes
weeklyFocusSessions
weeklyReminderResponseRate
weeklyHabitCompletionRate
weeklyRescheduleRate
weeklyKairoUsage
```

Compare against the previous week.

Example:

```text
Focus time
This week: 12h 40m
Last week: 10h 15m

Change: +23.6%
```

Calculate percentage changes safely when the previous value is zero.

---

# 23. MONTHLY ANALYTICS

Create monthly aggregation.

Include:

* total completed tasks
* completion rate
* focus time
* habit consistency
* reminder response
* rescheduling patterns
* Kairo usage
* energy patterns
* mood trends

Provide 30-day and calendar-month views where appropriate.

---

# 24. DAILY SUMMARY CARDS

Implement concise cards.

Example:

```text
Today's Progress

8 / 11 tasks completed

73%
```

```text
Focus

3h 42m

+18% vs yesterday
```

```text
Habits

5 / 6 completed
```

```text
Reminders

82% responded
```

Do not overwhelm the user with metrics.

---

# 25. WEEKLY PRODUCTIVITY REPORT

Create a clean weekly report.

Example:

```text
Your Week

Tasks
42 completed

Focus
16h 20m

Completion
78%

Habits
86%

Best observed period
Tuesday 9–11 AM

Most rescheduled category
Coding
```

Include trend comparisons.

---

# 26. MONTHLY INSIGHTS

Generate descriptive insights from analytics.

Examples:

> Your task completion rate increased 12% compared with last month.

> You completed most focus sessions between 9 AM and 12 PM.

> You rescheduled long-duration tasks more often than short tasks.

Do not generate medical, psychological, or deterministic claims.

---

# 27. PRODUCTIVITY HEATMAP

Implement a heatmap showing activity over:

```text
Day × Hour
```

Example:

```text
          8AM  9AM  10AM 11AM 12PM
Mon        ░    █    █    ▓    ░
Tue        ▓    █    █    █    ░
Wed        ░    ▓    █    ▓    ░
Thu        ▓    █    ▓    ▓    ░
Fri        ░    ▓    █    ░    ░
```

Use the project's existing visualization library if one is already installed.

Do NOT add a large charting dependency if the current stack already supports the required charts.

---

# 28. ANALYTICS VIEW

Extend the existing:

`AnalyticsView.tsx`

Do not redesign the entire application.

Use a hierarchy:

```text
Analytics

[Today] [7 Days] [30 Days]

--------------------------------

Overview

Tasks completed
Focus time
Completion rate
Habit consistency

--------------------------------

Productivity Trend

[Chart]

--------------------------------

Focus Patterns

[Chart]

--------------------------------

Activity Heatmap

[Heatmap]

--------------------------------

Behavior Patterns

[Insight cards]

--------------------------------

Kairo Insights

[AI-related analytics]
```

Keep the interface clean and readable.

---

# 29. EMPTY STATE / COLD START

New users will have insufficient data.

Do NOT show misleading graphs.

Instead:

```text
You're just getting started.

Complete a few tasks and focus sessions
to unlock your productivity patterns.
```

Progressively unlock analytics.

Example:

```text
0–2 days
Basic activity

3–6 days
Early trends

7+ days
Weekly patterns

30+ days
Reliable long-term trends
```

Do not call a pattern "reliable" merely because a fixed number of days has passed; use the UI language carefully.

---

# 30. DATA QUALITY

Analytics must handle:

* deleted tasks
* cancelled tasks
* recurring tasks
* overdue tasks
* timezone changes
* offline events
* duplicate events
* missing timestamps
* incomplete focus sessions
* app crashes
* abandoned sessions

Never allow malformed telemetry to crash analytics aggregation.

---

# 31. TIMEZONE RULES

Use IANA timezone identifiers.

Example:

```text
Asia/Kolkata
```

All analytics should respect the user's timezone.

A task completed at:

```text
23:30 India
```

must not accidentally appear as the next day's activity because of UTC conversion.

Store canonical timestamps but aggregate using the user's configured timezone.

---

# 32. PERFORMANCE

Do NOT query the entire task history every time the Analytics screen opens.

Use:

```text
daily aggregates
weekly aggregates
monthly aggregates
```

where appropriate.

Use pagination for raw event history.

Cache analytics results.

Invalidate or refresh aggregates when new telemetry arrives.

Avoid unnecessary Firestore reads.

---

# 33. FIRESTORE STRUCTURE

Use a scalable structure such as:

```text
users/{userId}/telemetry/{eventId}

users/{userId}/analytics_daily/{date}

users/{userId}/analytics_weekly/{weekId}

users/{userId}/analytics_monthly/{monthId}
```

Keep raw events separate from aggregated analytics.

Do not expose another user's analytics through client queries.

---

# 34. FIRESTORE SECURITY

All analytics data must be scoped to the authenticated user.

A user must never be able to:

* read another user's telemetry
* write another user's telemetry
* modify another user's analytics
* query global private telemetry

Use Firebase Security Rules.

Backend telemetry endpoints must validate authenticated user identity.

Never trust a `userId` supplied blindly by the client.

---

# 35. FASTAPI TELEMETRY API

Inspect the existing:

`backend/app/api/telemetry.py`

before modifying it.

Reuse existing endpoints.

Do not create duplicate routes.

Implement only what is missing.

Possible endpoints:

```text
POST /telemetry/events

POST /telemetry/batch

GET /analytics/daily

GET /analytics/weekly

GET /analytics/monthly

GET /analytics/trends
```

Use authentication.

Validate payloads with Pydantic models.

Reject malformed events.

---

# 36. BATCHING

Mobile clients may generate many events.

Support batched telemetry uploads.

Example:

```json
{
  "events": [
    {},
    {},
    {}
  ]
}
```

Limit batch size.

Retry failed batches safely.

Do not duplicate successfully uploaded events.

---

# 37. ANALYTICS CACHING

The Analytics screen should not trigger a full recomputation every time it opens.

Use:

```text
local cache
+
Firestore aggregates
+
incremental updates
```

Refresh intelligently.

---

# 38. TESTING

Add comprehensive tests.

### Telemetry

* event creation
* validation
* deduplication
* batching
* offline queue
* retry

### Task analytics

* completion rate
* velocity
* on-time completion
* overdue handling

### Focus

* duration
* pause handling
* abandoned sessions
* completion rate

### Notifications

* sent
* opened
* ignored
* snoozed
* completed

### Energy

* low
* medium
* high
* aggregation

### Habits

* current streak
* longest streak
* missed day
* timezone

### Rescheduling

* reschedule count
* rate
* category aggregation

### Aggregation

* daily
* weekly
* monthly
* timezone

### Cold start

* zero data
* insufficient data
* partial data

---

# 39. PERFORMANCE TESTING

Verify that Analytics does not cause excessive Firestore reads.

Test:

```text
10 events
100 events
1,000 events
10,000 events
```

The UI should remain responsive.

Do not load all raw telemetry into the client.

---

# 40. ACCEPTANCE CRITERIA

Phase 8 is complete only when:

### Telemetry

* [ ] Task telemetry works.
* [ ] Focus telemetry works.
* [ ] Reminder telemetry integrates with Phase 7.
* [ ] Kairo interaction telemetry works.
* [ ] Mood logging works.
* [ ] Energy logging works.
* [ ] Habit telemetry works.
* [ ] Rescheduling telemetry works.

### Analytics

* [ ] Task completion metrics work.
* [ ] Task velocity works.
* [ ] Focus duration metrics work.
* [ ] Productivity by hour works.
* [ ] Productivity by weekday works.
* [ ] Notification interaction analytics work.
* [ ] Kairo analytics work.
* [ ] Mood/energy trends work.
* [ ] Habit streaks work.
* [ ] Rescheduling patterns work.

### Reports

* [ ] Daily summary cards work.
* [ ] Weekly report works.
* [ ] Monthly insights work.
* [ ] Productivity heatmap works.
* [ ] Trend graphs work.

### Reliability

* [ ] Offline telemetry is queued.
* [ ] Offline telemetry synchronizes after reconnect.
* [ ] Duplicate events are prevented.
* [ ] Timezones are handled correctly.
* [ ] Missing/invalid data does not crash analytics.

### Security

* [ ] Users can only access their own analytics.
* [ ] Backend validates authenticated identity.
* [ ] Firestore rules protect telemetry.
* [ ] No secrets are stored in telemetry.

### ML Preparation

* [ ] Procrastination-related behavioral features are collected.
* [ ] Rescheduling features are collected.
* [ ] Reminder-response features are collected.
* [ ] Energy/task relationship data is collected.
* [ ] Focus behavior is collected.
* [ ] Dataset schema is documented.

**Do NOT train ML models in Phase 8.**

---

# 41. DEFINITION OF DONE

Before declaring Phase 8 complete:

Run:

```text
npm run lint:types
npm run build
npm test
```

Also run the FastAPI test suite.

Verify:

```text
0 TypeScript errors

0 failing tests

0 production build errors
```

Perform manual testing for:

```text
Task creation
      ↓
Telemetry generated
      ↓
Firestore
      ↓
Analytics aggregation
      ↓
Analytics View
```

Then test:

```text
Offline activity
      ↓
Local queue
      ↓
Reconnect
      ↓
Telemetry synchronization
      ↓
Analytics update
```

Finally test:

```text
Timezone = Asia/Kolkata
Timezone = another supported timezone
```

and verify that day/hour aggregation remains correct.

---

# 42. FINAL IMPLEMENTATION REPORT

After implementation, provide a concise report containing:

1. Files created
2. Files modified
3. Existing code reused
4. Telemetry event taxonomy
5. Firestore schema
6. Analytics aggregation architecture
7. Metrics implemented
8. Charts/reports implemented
9. Offline telemetry strategy
10. Privacy considerations
11. Security rules changes
12. Dependencies added
13. Tests performed
14. Build/type-check results
15. Known limitations
16. Phase 9 ML-ready features collected

Do not claim completion unless the acceptance criteria have actually been verified.

---

# IMPORTANT

Do not over-engineer Phase 8.

The purpose of this phase is:

```text
COLLECT CLEAN DATA
        ↓
AGGREGATE IT CORRECTLY
        ↓
VISUALIZE IT CLEARLY
        ↓
PREPARE FOR ML
```

Do not implement:

* XGBoost
* Random Forest
* KMeans
* Procrastination prediction
* ML-based scheduling
* ML-based energy prediction
* SHAP explanations

Those belong to the next intelligence phase.

Build Phase 8 as the **data foundation that makes those systems possible later**.

tHI IS THE ABOVE PROMPT YOU SHOULD FOLLOW 
