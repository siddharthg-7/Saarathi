# Machine Learning Pipeline Diagrams: Saarathi & Kairo

These detailed architecture diagrams illustrate the end-to-end data processing, feature engineering, model training, and real-time inference pipelines powering **Saarathi's** machine learning intelligence engine.

---

## 1. End-to-End ML Telemetry & Feedback Loop Pipeline

*Shows how user actions continuously feed data back into the machine learning models to improve future predictions.*

```
[User Action Events: Complete, Postpone, Skip, Focus, Energy Logs]
       │
       ▼ (Real-time Event Payload)
[FastAPI Backend Gateway] ──► [Firestore Telemetry Collections]
                                      │
                                      ▼ (Nightly / Weekly Celery Cron Job)
                             [Feature Engineering Service (Pandas / NumPy)]
                                      ├── Extract Temporal Features (Day, Time, Duration)
                                      ├── Aggregate Environmental Context (Location, Energy, Mood)
                                      └── Calculate Historical Postpone & Failure Ratios
                                      │
                                      ▼
                             [Model Training & Validation Engine]
                                      ├── Scikit-Learn / XGBoost / CatBoost
                                      └── Export Optimized .pkl Model Artifacts
                                      │
                                      ▼
                             [Inference Memory Cache (Redis)]

```

---

## 2. Real-Time Predictive Inference Pipeline

*Shows how incoming user tasks and real-time context are evaluated by trained models to generate skip probabilities and energy alignments instantly.*

```
[User Opens App / Interacts with Task / Requests Smart Schedule]
       │
       ▼
[FastAPI Inference Endpoint (`/ml/predict-task`)]
       │
       ├──► [Payload Extraction] (Task Category, Day, Time, User Energy, Postpone Count)
       │
       ▼
[Load Pre-trained Models from Memory (.pkl / XGBoost / KMeans)]
       ├──► XGBoost / Random Forest Model ──► Calculates Skip, Delay, & Completion Probabilities
       └──► KMeans Clustering Model       ──► Classifies Energy Block (Morning / Afternoon / Night)
       │
       ▼
[Explainable AI (XAI) Feature Importance Evaluator]
       │ (Maps prediction back to specific behavioral triggers)
       ▼
[Kairo Contextual Engine & Proactive Intervention Formatter]
       │
       ▼
[JSON Response Delivered to Client / UI Notification Triggered]
> "Skip Probability: 82%. Explanation: You usually skip fitness tasks on Monday nights when your energy is low."

```