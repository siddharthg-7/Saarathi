# API Contracts Reference: Saarathi & Kairo

This document defines the RESTful and WebSocket API contracts for the FastAPI backend gateway powering **Saarathi** and its AI assistant **Kairo**. All request and response payloads are formatted in JSON.

---

## Base Configuration

* **Base URL:** `[https://api.saarathi.os/v1](https://api.saarathi.os/v1)` (or `http://localhost:8000/v1` for local development)
* **Authentication:** Bearer Token via Firebase ID Token (`Authorization: Bearer <FIREBASE_ID_TOKEN>`)

---

## 1. Voice & Brain Dump Endpoints

### Post a Voice Brain Dump

Transcribes raw audio via Deepgram STT, extracts structured tasks using Groq (Llama 3.3), and writes them directly to Firestore.

* **Endpoint:** `POST /brain-dump/audio`
* **Content-Type:** `multipart/form-data`
* **Request Form Data:**
* `audio`: Binary audio file (`.wav`, `.mp3`, `.m4a`)
* `timezone`: String (e.g., `Asia/Kolkata`)


* **Response Status:** `201 Created`
* **Response Body:**

```json
{
  "status": "success",
  "brainDumpId": "bd_99281048234",
  "rawTranscript": "I need to finish my assignment before Friday, buy groceries, and call Rahul.",
  "extractedTasks": [
    {
      "id": "task_abc123",
      "title": "Complete Assignment",
      "estimatedDuration": 120,
      "energyRequired": "High",
      "category": "Study",
      "priority": 4,
      "deadline": "2026-08-07T23:59:59Z"
    },
    {
      "id": "task_xyz789",
      "title": "Buy Groceries",
      "estimatedDuration": 45,
      "energyRequired": "Low",
      "category": "Personal",
      "priority": 2,
      "deadline": "2026-08-04T20:00:00Z"
    }
  ]
}

```

---

## 2. Kairo AI & Chat Endpoints

### Send Conversational Message to Kairo

Handles natural dialogue with context awareness (active tasks, schedule, energy levels).

* **Endpoint:** `POST /kairo/chat`
* **Content-Type:** `application/json`
* **Request Body:**

```json
{
  "message": "What should I work on right now?",
  "clientContext": {
    "currentLocation": "College",
    "currentEnergy": "Medium",
    "activeFocusMode": false
  }
}

```

* **Response Status:** `200 OK`
* **Response Body:**

```json
{
  "role": "assistant",
  "message": "You only have 40 minutes before your next class. Complete the API integration subtask first to keep momentum.",
  "suggestedActions": [
    {
      "actionType": "START_TASK",
      "taskId": "task_abc123"
    }
  ],
  "timestamp": "2026-08-03T18:15:00Z"
}

```

### Retrieve Morning Daily Briefing

Generates Kairo’s synthesized morning briefing based on yesterday's performance and today's schedule.

* **Endpoint:** `GET /kairo/daily-brief`
* **Response Status:** `200 OK`
* **Response Body:**

```json
{
  "greeting": "Good morning! You completed 9 of 11 tasks yesterday.",
  "optimalFocusWindow": {
    "start": "09:30:00",
    "end": "11:30:00"
  },
  "insights": "Your hardest work is scheduled during your peak focus window. Consider moving your gym session to tomorrow morning.",
  "scheduleSummary": [
    { "time": "09:00", "task": "DSA Practice" },
    { "time": "11:00", "task": "API Integration" }
  ]
}

```

---

## 3. Machine Learning & Predictive Endpoints

### Get Task Prediction Scores (Procrastination & Completion)

Queries XGBoost/Random Forest models to calculate skip and delay probabilities.

* **Endpoint:** `POST /ml/predict-task`
* **Content-Type:** `application/json`
* **Request Body:**

```json
{
  "taskId": "task_xyz789",
  "category": "Fitness",
  "scheduledDay": "Monday",
  "scheduledTime": "21:00",
  "userEnergy": "Low",
  "postponeCount": 3
}

```

* **Response Status:** `200 OK`
* **Response Body:**

```json
{
  "taskId": "task_xyz789",
  "completionProbability": 0.18,
  "skipProbability": 0.82,
  "delayProbability": 0.75,
  "explanation": "You usually skip fitness tasks on Monday nights when your energy is low."
}

```

### Get Energy Clustering Recommendations

Evaluates user energy logs using KMeans to determine best working hours.

* **Endpoint:** `GET /ml/energy-clusters`
* **Response Status:** `200 OK`
* **Response Body:**

```json
{
  "bestCodingHours": "09:00 - 12:00",
  "bestReadingHours": "14:00 - 16:00",
  "worstProductivityTime": "19:00 - 21:00"
}

```

---

## 4. Vector Memory (Supabase PGVector) Endpoints

### Semantic Memory Search

Searches the user's long-term vector database for past notes, chat logs, or startup ideas.

* **Endpoint:** `POST /memory/search`
* **Content-Type:** `application/json`
* **Request Body:**

```json
{
  "query": "What was that startup idea from three months ago?",
  "topK": 3
}

```

* **Response Status:** `200 OK`
* **Response Body:**

```json
{
  "results": [
    {
      "sourceType": "brain_dump",
      "sourceId": "bd_102938",
      "content": "Decentralized verification platform designed to flag fraudulent internship listings using Solidity and IPFS.",
      "similarityScore": 0.91
    }
  ]
}

```

---

## 5. Telemetry & Event Logging Endpoints

### Log Task Telemetry Event

Sends user action events (complete, postpone, skip) to update behavioral features.

* **Endpoint:** `POST /telemetry/event`
* **Content-Type:** `application/json`
* **Request Body:**

```json
{
  "taskId": "task_xyz789",
  "eventType": "POSTPONED",
  "currentPostponeCount": 4,
  "context": {
    "location": "Home",
    "mood": "Tired",
    "energy": "Low"
  },
  "timestamp": "2026-08-03T21:05:00Z"
}

```

* **Response Status:** `204 No Content`