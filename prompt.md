# Phase 10 — Saarathi Explainable AI (XAI) Engine

You are continuing development of **Saarathi**, an AI-powered personal productivity operating system.

The AI assistant is called **Kairo**.

Phase 7 — Notification & Smart Reminder Engine — is complete.

Phase 8 — Analytics & Behavioral Telemetry — is complete.

Phase 9 — Behavioral ML / Prediction Engine — should already provide the predictive foundation.

Your task is to implement:

# Phase 10 — Explainable AI (XAI)

The objective is to make Saarathi's AI predictions and scheduling recommendations **transparent, evidence-based, and understandable to the user**.

---

# 1. CORE PRINCIPLE

Saarathi must never produce a black-box statement such as:

> "You should move Gym to Tuesday."

without being able to explain why.

The architecture must be:

```text
User Behavioral Data
        ↓
Phase 8 Telemetry
        ↓
Phase 9 ML Model
        ↓
Prediction
        ↓
Feature Contributions
        ↓
XAI Explanation Engine
        ↓
Kairo Natural Language Layer
        ↓
User
```

The most important rule:

```text
MODEL FACTS → XAI → KAIRO
```

NOT:

```text
MODEL PREDICTION → LLM GUESS
```

Kairo must never invent reasons that are not supported by the model output or verified behavioral statistics.

---

# 2. FIRST STEP — INSPECT THE EXISTING SYSTEM

Before writing code, inspect the existing implementation.

Specifically inspect:

```text
Phase 8 telemetry
Phase 8 analytics
Phase 9 ML models
Phase 9 feature engineering
Phase 9 prediction APIs
Phase 9 model storage
Phase 9 model evaluation
Task scheduling logic
Kairo AI service
Smart reminder service
```

Identify:

* existing model names
* prediction endpoints
* feature names
* feature schemas
* prediction response structures
* model versions
* training datasets
* existing analytics calculations
* existing task scheduling APIs
* existing Kairo API
* existing authentication mechanism

Do NOT create duplicate prediction infrastructure.

Do NOT rename existing Phase 9 APIs unless absolutely necessary.

Extend the existing architecture.

Before implementation, create a short internal implementation plan based on the actual repository.

---

# 3. XAI OBJECTIVE

For every supported ML prediction, return:

```text
Prediction
+
Confidence / probability
+
Important contributing factors
+
Direction of contribution
+
Supporting behavioral evidence
+
Model metadata
```

Example:

```json
{
  "prediction": {
    "type": "task_completion",
    "probability": 0.18,
    "label": "high_skip_risk"
  },

  "contributors": [
    {
      "feature": "historical_completion_rate",
      "value": 0.20,
      "contribution": -0.31,
      "direction": "negative"
    },
    {
      "feature": "time_of_day",
      "value": "21:00",
      "contribution": -0.24,
      "direction": "negative"
    }
  ],

  "evidence": [
    {
      "metric": "Monday evening gym completion",
      "value": "20%",
      "sampleSize": 5
    }
  ],

  "model": {
    "name": "procrastination_model",
    "version": "1.0.0"
  }
}
```

The exact schema should be adapted to the existing Phase 9 implementation.

---

# 4. SUPPORTED XAI PREDICTIONS

Implement XAI for the predictions that actually exist in Phase 9.

Potential prediction types include:

```text
task_completion_probability
procrastination_probability
task_delay_probability
energy_match
schedule_recommendation
reminder_timing
```

Do NOT implement explanations for models that do not exist.

Do NOT fabricate model outputs.

---

# 5. FEATURE IMPORTANCE

Implement model-specific feature contribution analysis.

For tree-based models such as:

* XGBoost
* Random Forest
* LightGBM

prefer a local explanation method such as **SHAP TreeExplainer** where technically appropriate.

The objective is to explain an individual prediction, not merely provide global feature importance.

Distinguish:

```text
Global importance
```

from:

```text
Local contribution
```

Example:

Global:

> Time of day is generally an important feature.

Local:

> For this particular task, the 9 PM start time contributed strongly toward the predicted delay risk.

The second is what Kairo should use.

---

# 6. DO NOT OVERSTATE MODEL EXPLANATIONS

Feature contribution is not automatically causation.

Never generate:

> "Your fatigue caused you to skip the task."

Instead:

> "Higher fatigue scores have been associated with lower completion rates for this type of task in your recent history."

Use careful language.

Preferred terms:

* contributed to the prediction
* associated with
* correlated with
* was a strong signal
* your recent history shows
* increased the predicted probability
* decreased the predicted probability

Avoid:

* caused
* guaranteed
* will definitely
* always
* never

unless the underlying fact genuinely supports it.

---

# 7. FEATURE CONTRIBUTION NORMALIZATION

Different ML models may produce contributions on different scales.

Create a normalized representation for the frontend and Kairo.

Example:

```text
strong_positive
positive
neutral
negative
strong_negative
```

Possible internal representation:

```text
contribution
absoluteContribution
direction
importanceRank
```

Do not hide the raw model value from the backend response.

The frontend should receive both:

```text
raw contribution
```

and:

```text
human-readable contribution strength
```

---

# 8. FEATURE METADATA REGISTRY

Create a centralized feature metadata registry.

Example:

```text
historical_completion_rate
time_of_day
day_of_week
task_duration
task_priority
energy_level
notification_snooze_count
reschedule_count
recent_focus_duration
deadline_distance
```

Each feature should have:

```text
displayName
description
unit
format
positiveMeaning
negativeMeaning
privacyLevel
```

Example:

```json
{
  "feature": "historical_completion_rate",
  "displayName": "Historical completion rate",
  "description": "How often you have completed similar tasks in comparable conditions.",
  "unit": "percentage"
}
```

Do not hardcode feature explanations throughout the application.

---

# 9. BEHAVIORAL EVIDENCE

ML explanations should be supplemented with actual user-specific statistics from Phase 8.

Example:

Prediction:

```text
Skip probability = 82%
```

Supporting evidence:

```text
Monday evening gym tasks:
1 completed
4 skipped
```

Then Kairo can say:

> "You've completed only 1 of your last 5 Monday evening gym sessions."

The evidence must come from actual telemetry.

Do not manufacture examples.

---

# 10. MINIMUM SAMPLE SIZE

This is extremely important.

Do not generate strong behavioral claims from tiny datasets.

Example:

If:

```text
sampleSize = 1
```

Do not say:

> "You usually skip this."

Instead:

> "There isn't enough history yet to identify a reliable pattern."

Create configurable minimum sample thresholds.

Example:

```text
MIN_EVIDENCE_SAMPLE_SIZE
```

Do not blindly assume a fixed threshold is statistically sufficient.

Make the threshold configurable.

---

# 11. CONFIDENCE HANDLING

Distinguish:

```text
prediction probability
```

from:

```text
explanation confidence
```

They are not necessarily the same thing.

Example:

```text
Prediction:
82% skip probability

Evidence:
5 historical observations

Explanation confidence:
Low / Limited evidence
```

The UI should not display:

> "82% confidence"

unless that is actually what the model metric represents.

Use accurate terminology such as:

> "Predicted skip probability: 82%"

rather than incorrectly calling it confidence.

---

# 12. EXPLANATION QUALITY LEVEL

Create explanation quality states.

Example:

```text
insufficient_data
limited_evidence
moderate_evidence
strong_evidence
```

These should depend on:

* available behavioral history
* sample size
* feature availability
* model confidence/calibration where available

This prevents Saarathi from sounding overly certain when there is little evidence.

---

# 13. NATURAL LANGUAGE REASONING ENGINE

Create a deterministic XAI → natural-language layer.

The LLM should receive structured evidence rather than raw telemetry.

Example input:

```json
{
  "prediction": "high_skip_risk",
  "probability": 0.82,
  "contributors": [
    {
      "feature": "time_of_day",
      "direction": "negative",
      "strength": "strong"
    }
  ],
  "evidence": [
    {
      "fact": "Monday evening gym completion rate",
      "value": 20,
      "sampleSize": 5
    }
  ]
}
```

Then Kairo converts it into natural language.

---

# 14. KAIRO EXPLANATION RULES

Kairo should follow these rules:

### Rule 1

Never invent a contributor.

### Rule 2

Never invent statistics.

### Rule 3

Never invent historical events.

### Rule 4

Never expose raw internal model terminology unnecessarily.

Instead of:

> SHAP value = -0.31

say:

> The timing of this task is one of the strongest factors increasing its predicted skip risk.

### Rule 5

Never claim causality without evidence.

### Rule 6

If evidence is weak, explicitly say so.

Example:

> "I only have two comparable past sessions, so this is an early signal rather than a reliable pattern."

### Rule 7

Keep explanations concise.

---

# 15. EXAMPLE — PROCRASTINATION

Suppose the model predicts:

```text
skipProbability = 0.82
```

and the evidence shows:

```text
Monday 9 PM gym:

completed = 1
skipped = 4

completionRate = 20%
```

Kairo may say:

> **High skip risk**
>
> You have completed 1 of your last 5 Monday evening gym sessions. Your completion rate for this time slot is 20%, so the model predicts a high likelihood of postponement.
>
> Would you like me to suggest a different time?

Do not say:

> "Your fatigue caused you to skip."

unless the evidence actually supports a causal conclusion—which normal observational telemetry generally cannot establish.

---

# 16. EXAMPLE — SMART SCHEDULING

Suppose:

```text
Current time:
9 PM

Task:
Deep study

Energy:
Low

Historical completion:
Low at 9 PM

Historical completion:
High at 9 AM
```

Kairo:

> **I recommend moving this to tomorrow morning.**
>
> You have a lower completion rate for similar deep-work tasks late in the evening, while your morning completion rate has been higher. Your current energy is also low.
>
> Want me to move it to 9 AM?

The scheduling recommendation must contain:

```text
current schedule
recommended schedule
reason
supporting evidence
prediction difference
```

Example:

```json
{
  "current": {
    "time": "21:00",
    "predictedCompletion": 0.34
  },

  "recommended": {
    "time": "09:00",
    "predictedCompletion": 0.71
  },

  "improvement": 0.37
}
```

Do not claim that the recommendation is guaranteed to succeed.

---

# 17. SCHEDULING EXPLANATION OBJECT

Create a standard structure:

```text
ScheduleRecommendation {
  taskId

  currentSchedule {
    date
    time
    predictedCompletion
  }

  recommendedSchedule {
    date
    time
    predictedCompletion
  }

  contributors[]

  evidence[]

  improvementEstimate

  explanationQuality

  modelVersion

  generatedAt
}
```

Adapt the exact TypeScript structure to existing project conventions.

---

# 18. BACKEND RESPONSE CONTRACT

Prediction APIs should return structured XAI information.

Preferred architecture:

```json
{
  "prediction": {},
  "explanation": {
    "summary": "",
    "contributors": [],
    "evidence": [],
    "quality": ""
  },
  "model": {
    "name": "",
    "version": ""
  }
}
```

Do not return only:

```json
{
  "prediction": 0.82
}
```

The frontend should not need to reverse-engineer the explanation.

---

# 19. API DESIGN

Inspect existing Phase 9 APIs first.

Extend them rather than creating duplicate endpoints.

Possible endpoint:

```text
POST /ml/predict
```

returning:

```text
prediction
+
explanation
```

or, if the existing architecture separates prediction and explanation:

```text
POST /xai/explain
```

Use whichever architecture best matches the existing codebase.

Do NOT create unnecessary network calls.

If the model prediction and explanation can be generated in one backend operation, prefer that.

---

# 20. SECURITY

XAI responses contain personal behavioral information.

Treat them as private user data.

The backend must:

* authenticate the user
* validate ownership of task IDs
* validate ownership of telemetry-derived evidence
* never expose another user's behavioral patterns
* never accept arbitrary feature values from the client as trusted evidence

The server must derive evidence from trusted backend data.

Do not allow the client to say:

```text
"User skipped this task 80% of the time"
```

and have the backend blindly display it.

---

# 21. FRONTEND XAI COMPONENT

Create a reusable component.

Possible:

```text
ExplainabilityCard.tsx
```

Example UI:

```text
┌──────────────────────────────────────┐
│ Kairo's reasoning                    │
│                                      │
│ High skip risk · 82%                 │
│                                      │
│ Why?                                 │
│                                      │
│ ● Monday evening timing              │
│   Strong signal                      │
│                                      │
│ ● Similar tasks were often delayed   │
│                                      │
│ Evidence                             │
│                                      │
│ 1 / 5 Monday gym sessions completed  │
│                                      │
│ [Move to Tuesday morning]            │
└──────────────────────────────────────┘
```

Keep the UI simple.

Do not expose raw SHAP plots by default.

---

# 22. OPTIONAL DETAIL VIEW

For advanced users, provide:

`Why am I seeing this?`

Opening it can show:

```text
Prediction
82%

Top contributing factors

1. Time of day
2. Historical completion rate
3. Energy level

Evidence

5 comparable sessions
```

This gives transparency without overwhelming normal users.

---

# 23. EXPLANATION TRACEABILITY

Every generated explanation should be traceable.

Store or return:

```text
explanationId
predictionId
modelName
modelVersion
featureSetVersion
generatedAt
```

This becomes important when models change.

Example:

```text
Model v1.2
```

may produce different explanations than:

```text
Model v1.3
```

Do not lose model-version information.

---

# 24. MODEL VERSIONING

Every prediction must include:

```text
modelName
modelVersion
featureVersion
```

Example:

```json
{
  "modelName": "procrastination_xgb",
  "modelVersion": "1.0.0",
  "featureVersion": "1.0.0"
}
```

Do not hardcode these values in the frontend.

---

# 25. EXPLANATION CACHING

Do not unnecessarily regenerate identical explanations.

If:

```text
same prediction
same model version
same feature values
```

are still valid, reuse the explanation where appropriate.

Invalidate when:

* task changes
* relevant telemetry changes
* model version changes
* feature version changes
* prediction changes

---

# 26. KAIRO + XAI ARCHITECTURE

The final architecture should be:

```text
             USER
               │
               ▼
        Saarathi Task
               │
               ▼
        Feature Builder
               │
               ▼
          ML Model
               │
               ▼
         Prediction
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
 Feature            Evidence
Contributions      Generator
        │             │
        └──────┬──────┘
               ▼
          XAI Engine
               │
               ▼
      Structured Explanation
               │
               ▼
             Kairo
               │
               ▼
        Natural Language
               │
               ▼
             USER
```

---

# 27. DO NOT LET KAIRO OVERRIDE THE MODEL

Kairo can:

* explain
* summarize
* compare
* recommend
* ask permission

Kairo must not:

* modify prediction values
* invent feature importance
* invent behavioral evidence
* claim certainty
* fabricate statistics

The model and analytics backend remain authoritative for quantitative claims.

---

# 28. HUMAN CONTROL

AI recommendations must remain suggestions.

Example:

> I recommend moving Gym to Tuesday at 8 AM.

Buttons:

```text
[Move Task]

[Keep Current Time]

[Choose Another Time]
```

Never automatically reschedule an important user task solely because an ML model predicts a better outcome unless the user has explicitly enabled automatic scheduling.

---

# 29. COLD START

Integrate Phase 8's cold-start behavior.

If insufficient telemetry exists:

```text
prediction unavailable
```

or:

```text
heuristic recommendation
```

The explanation must explicitly identify the source.

Example:

> I don't have enough history to make a personalized prediction yet. This suggestion is based on your task's deadline and estimated duration rather than learned behavior.

Never present a heuristic as an ML prediction.

---

# 30. FALLBACK EXPLANATIONS

If SHAP or another explanation mechanism fails:

Do NOT crash.

Return:

```text
prediction available
explanation unavailable
```

Then provide a safe explanation based only on verified aggregate evidence.

Example:

> The model predicts a high delay risk. I couldn't calculate detailed feature contributions for this prediction, but your recent completion history for similar tasks has been low.

Never fabricate feature importance as a fallback.

---

# 31. PERFORMANCE

XAI should not make Saarathi feel slow.

For interactive requests:

* calculate prediction and explanation in one backend operation where possible
* cache compatible explanations
* avoid unnecessary database queries
* retrieve only relevant historical evidence
* avoid sending large datasets to the client

Kairo's natural-language explanation may stream through the existing Kairo WebSocket infrastructure where appropriate.

However:

**The structured prediction/explanation payload must be available independently of the LLM.**

The UI must not depend on Kairo successfully generating prose.

---

# 32. ANALYTICS FOR XAI

Track:

```text
xai_explanation_shown
xai_details_opened
recommendation_accepted
recommendation_rejected
recommendation_ignored
```

Do not track private explanation content unnecessarily.

These events will later help evaluate whether explanations actually improve user trust and recommendation acceptance.

---

# 33. TESTING

Create tests for:

### Feature contributions

* correct ranking
* positive contribution
* negative contribution
* zero/neutral contribution

### Evidence

* correct historical counts
* correct sample size
* correct date ranges
* correct timezone

### Cold start

* insufficient data
* heuristic fallback
* no false ML claims

### Kairo

* does not invent evidence
* does not invent statistics
* does not change model values
* produces concise explanations

### Security

* user A cannot access user B's explanation
* task ownership is validated

### Model versioning

* correct model version
* feature version
* explanation invalidation

### Failure handling

* SHAP failure
* model failure
* missing feature
* missing telemetry
* LLM failure

The application must remain usable even when the natural-language explanation layer fails.

---

# 34. EXPLANATION GOLDEN TESTS

Create deterministic test fixtures.

Example:

```text
Historical data:

Monday 9 PM Gym:
completed = 1
skipped = 4

Tuesday 8 AM Gym:
completed = 4
skipped = 1

Current energy:
low

Prediction:
Monday 9 PM
skip probability = 0.82

Alternative:
Tuesday 8 AM
completion probability = 0.76
```

Expected explanation must contain only facts supported by the fixture.

Example acceptable:

> You completed 1 of your last 5 Monday evening gym sessions.

Example unacceptable:

> You are tired on Monday evenings.

unless fatigue/energy data actually exists in the fixture.

---

# 35. UI LANGUAGE

Use calm, non-judgmental language.

Avoid:

> You are lazy.

> You always procrastinate.

> You failed again.

Prefer:

> This task has been postponed several times.

> Your recent completion rate for similar tasks is lower during this time period.

> Would you like to try another time?

Saarathi should help without judging the user.

---

# 36. ACCESSIBILITY

Explainability UI must support:

* keyboard navigation
* screen readers
* readable contrast
* accessible labels
* expandable details
* mobile-friendly layout

Do not communicate meaning using color alone.

For example:

Do not use only:

```text
red = negative
green = positive
```

Also provide:

```text
Higher predicted delay risk
```

---

# 37. ACCEPTANCE CRITERIA

Phase 10 is complete only when:

### XAI

* [ ] Model-specific local feature contributions are available where supported.
* [ ] Global feature importance is distinguished from local explanations.
* [ ] Feature metadata registry exists.
* [ ] Feature contribution ranking works.
* [ ] Prediction + explanation are returned together or through a clean coordinated API.
* [ ] Model version is included.
* [ ] Feature version is included.

### Evidence

* [ ] Historical evidence is retrieved from trusted backend data.
* [ ] Sample sizes are shown or used internally.
* [ ] Weak evidence is clearly identified.
* [ ] No unsupported behavioral claims are generated.
* [ ] Timezone handling is correct.

### Kairo

* [ ] Kairo converts structured evidence into natural language.
* [ ] Kairo cannot invent feature importance.
* [ ] Kairo cannot invent historical statistics.
* [ ] Kairo cannot alter prediction values.
* [ ] Kairo uses non-judgmental language.
* [ ] Kairo distinguishes correlation from causation.

### Scheduling

* [ ] Schedule recommendations contain current vs recommended schedule.
* [ ] Predicted outcome difference is shown when available.
* [ ] Contributing factors are available.
* [ ] User must approve schedule changes unless explicit auto-scheduling is enabled.

### Cold Start

* [ ] Insufficient data is handled.
* [ ] Heuristic recommendations are clearly labeled.
* [ ] ML predictions are not presented without sufficient model input.

### Reliability

* [ ] XAI failure does not crash the application.
* [ ] LLM failure does not destroy structured explanations.
* [ ] Missing telemetry is handled gracefully.

### Security

* [ ] Behavioral explanations are user-scoped.
* [ ] Task ownership is validated.
* [ ] Backend does not trust client-supplied evidence.

### Testing

* [ ] Unit tests pass.
* [ ] Integration tests pass.
* [ ] TypeScript checks pass.
* [ ] Backend tests pass.
* [ ] Production build passes.

---

# 38. DEFINITION OF DONE

Before declaring Phase 10 complete, run:

```text
npm run lint:types
npm test
npm run build
```

Also run the FastAPI backend test suite.

Verify:

```text
0 TypeScript errors
0 failing frontend tests
0 failing backend tests
0 production build errors
```

Perform an end-to-end test:

```text
User creates task
        ↓
Phase 8 telemetry
        ↓
Phase 9 prediction
        ↓
Feature contribution calculation
        ↓
Evidence retrieval
        ↓
XAI structured response
        ↓
Kairo explanation
        ↓
User sees "Why?"
        ↓
User accepts/rejects recommendation
        ↓
Telemetry records the interaction
```

---

# 39. FINAL IMPLEMENTATION REPORT

After implementation, provide:

1. Files created
2. Files modified
3. Existing Phase 9 components reused
4. XAI architecture
5. Supported models
6. Explanation method used per model
7. Feature registry
8. Prediction response schema
9. Evidence generation strategy
10. Kairo reasoning pipeline
11. Cold-start behavior
12. Fallback behavior
13. Security changes
14. Tests performed
15. Build/type-check results
16. Known limitations
17. Phase 11 readiness

Do not claim Phase 10 is complete unless the acceptance criteria have actually been verified.

---

# FINAL ARCHITECTURAL RULE

Saarathi must always follow:

```text
PREDICT
   ↓
EXPLAIN
   ↓
EVIDENCE
   ↓
COMMUNICATE
   ↓
ASK
   ↓
ACT
```

Not:

```text
LLM
 ↓
Guess
 ↓
Pretend it is a fact
```

Kairo is the **communicator and productivity companion**.

The ML model is the **predictor**.

The XAI engine is the **translator of model behavior into evidence-backed explanations**.

The user remains **in control**.
