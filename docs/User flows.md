# User Flows: Saarathi & Kairo

These detailed user flows outline the step-by-step journeys for core interactions within **Saarathi**, showcasing how users navigate tasks, voice interactions, AI planning, and predictive insights across mobile and web interfaces.

---

## 1. Voice Brain Dump & Automated Task Extraction Flow

*Goal: Convert unstructured, rambling thoughts into structured, prioritized tasks via a voice note.*

```
[User taps Voice / Brain Dump icon on Mobile App]
       │
       ▼
[Recording Screen Active: Speak up to 2-minute voice note]
       │
       ▼
[User taps "Stop & Process"]
       │
       ▼
[Audio Stream sent to FastAPI Backend] ──► [Deepgram STT Transcribes Audio]
       │
       ▼
[Raw Transcript sent to Groq API (Llama 3.3)]
       ├── Extract Tasks & Subtasks
       ├── Detect Priorities & Deadlines
       └── Remove Duplicates & Assign Categories
       │
       ▼
[Structured JSON Payload returned to FastAPI]
       │
       ▼
[Firestore Batch Write: Tasks saved with default metadata & voice attachment]
       │
       ▼
[Real-time Firestore Snapshot Triggered]
       ├──► Mobile UI updates instantly with new task cards
       └──► Web Dashboard (Vite React) syncs in real time via live listener

```

---

## 2. Kairo Daily Briefing & Morning Planning Flow

*Goal: Greet the user every morning with an intelligent, data-driven productivity briefing.*

```
[User opens Saarathi app / web dashboard in the morning]
       │
       ▼
[Client requests Daily Briefing from FastAPI / Kairo Engine]
       │
       ▼
[Backend Aggregates Data Sources]
       ├── Yesterday's Task Completion Stats (Firestore)
       ├── Energy & Mood Logs
       ├── Calendar Events for Today (Google Calendar Sync)
       └── Procrastination & Focus Score History (ML Models)
       │
       ▼
[Groq LLM synthesizes personalized greeting & schedule recommendation]
       │
       ▼
[Kairo presents Daily Briefing card on UI (Text + optional Deepgram TTS audio)]
       │
       ├──► User clicks "Accept Schedule": Smart Scheduler locks time-blocks into calendar
       └──► User clicks "Modify": Prompts Kairo conversation to adjust specific slots

```

---

## 3. Procrastination Warning & Task Rescheduling Flow

*Goal: Intercept a skipped or repeatedly postponed task and offer a proactive ML-backed intervention.*

```
[User swipes to postpone "Gym Session" for the 4th time]
       │
       ▼
[Firestore event logged: Task postponement telemetry captured]
       │
       ▼
[Background Worker / ML Inference triggers prediction pipeline]
       ├── XGBoost model evaluates Task, Day (Monday), Time (9 PM), and History
       └── Returns Skip Probability: 82% & High Fatigue Correlation
       │
       ▼
[Kairo triggers proactive notification / inline intervention card]
       │
       ▼
[Kairo Prompt Displayed]
       > "You've postponed this task 4 times on Monday nights due to fatigue. 
       > Would you like me to move it to your optimal window tomorrow morning at 7 AM?"
       │
       ├──► User clicks "Yes, reschedule": Task automatically updated & calendar shifted
       └──► User clicks "Keep for tonight": Kairo logs user choice and scales down difficulty / duration

```

---

## 4. Cross-Platform Real-Time Sync Flow

*Goal: Ensure seamless state consistency between mobile (React Native) and web (Vite React).*

```
[User on Desktop Web Dashboard marks "Complete API Integration" as finished]
       │
       ▼
[Zustand Store dispatches update to Firestore Database]
       │
       ▼
[Firestore Document updated with status: 'completed' & server timestamp]
       │
       ▼
[Active Real-time Listeners (`onSnapshot`) fire across connected devices]
       ├──► Mobile App UI updates instantly: Task moves to completed list
       ├──► Analytics Engine recalculates daily completion % & streak counts
       └──► ML Feature Store logs completion telemetry for future predictions

```