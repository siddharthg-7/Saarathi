# Database Schema: Saarathi & Kairo

This comprehensive database schema covers the multi-model data architecture required for **Saarathi**, integrating **Firestore** (document store for real-time operational data), **Supabase PGVector** (for semantic vector memory search), and **Redis** (for fast caching and state management).

---

## 1. Firestore Collections (Document Architecture)

### `users`

Stores core user profile data, app preferences, and daily configuration settings.

```json
{
  "uid": "string (Firebase Auth UID)",
  "email": "string",
  "displayName": "string",
  "brandingName": "string",
  "createdAt": "timestamp",
  "settings": {
    "theme": "string (dark/light)",
    "notificationsEnabled": "boolean",
    "workingHoursStart": "string (e.g., '09:00')",
    "workingHoursEnd": "string (e.g., '18:00')",
    "defaultPomodoroDuration": "number (minutes)"
  }
}

```

### `tasks`

Stores rich task metadata supporting advanced AI summaries, machine learning features, and habit tracking.

```json
{
  "id": "string (UUID)",
  "uid": "string (Foreign Key -> users.uid)",
  "title": "string",
  "estimatedDuration": "number (minutes)",
  "energyRequired": "string (Low | Medium | High)",
  "category": "string (e.g., Coding, Fitness, Study)",
  "difficulty": "number (1-5)",
  "importance": "number (1-5)",
  "urgency": "number (1-5)",
  "status": "string (pending | in_progress | completed | skipped)",
  "deadline": "timestamp",
  "scheduledTime": "timestamp (nullable)",
  "aiSummary": "string",
  "voiceRecordingUrl": "string (nullable Cloud Storage link)",
  "tags": ["string"],
  "context": "string (Home | College | Office | Travel)",
  "mood": "string (nullable)",
  "location": "string (nullable)",
  "completionConfidence": "number (0-1 float)",
  "predictedDelayScore": "number (0-1 float)",
  "habitRelationId": "string (nullable -> habits.id)",
  "postponeCount": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

```

### `subtasks`

Breaks down complex tasks or goals into manageable sequential items.

```json
{
  "id": "string (UUID)",
  "taskId": "string (Foreign Key -> tasks.id)",
  "uid": "string",
  "title": "string",
  "completed": "boolean",
  "orderIndex": "number"
}

```

### `habits`

Tracks recurring habits, consistency streaks, and behavioral statistics.

```json
{
  "id": "string (UUID)",
  "uid": "string (Foreign Key -> users.uid)",
  "title": "string",
  "category": "string",
  "streakCount": "number",
  "completionPercentage": "number (float)",
  "failurePercentage": "number (float)",
  "bestDay": "string (e.g., 'Tuesday')",
  "worstDay": "string (e.g., 'Monday')",
  "activeDays": ["string"],
  "createdAt": "timestamp"
}

```

### `goals`

Tracks macro-level life and career objectives for AI decomposition.

```json
{
  "id": "string (UUID)",
  "uid": "string (Foreign Key -> users.uid)",
  "title": "string",
  "description": "string",
  "status": "string (in_progress | completed)",
  "targetDate": "timestamp",
  "roadmapGenerated": "boolean",
  "createdAt": "timestamp"
}

```

### `brain_dump`

Stores raw voice transcripts and processing results from brain-dump sessions.

```json
{
  "id": "string (UUID)",
  "uid": "string (Foreign Key -> users.uid)",
  "rawTranscript": "string",
  "audioUrl": "string",
  "extractedTaskIds": ["string"],
  "processedAt": "timestamp"
}

```

### `energy_logs`

Daily user check-ins used by KMeans clustering to map productivity windows.

```json
{
  "id": "string (UUID)",
  "uid": "string (Foreign Key -> users.uid)",
  "date": "string (YYYY-MM-DD)",
  "timeBlock": "string (Morning | Afternoon | Night)",
  "energyLevel": "string (Low | Medium | High)",
  "loggedAt": "timestamp"
}

```

### `mood_logs`

Captures emotional context linked to task performance and procrastination patterns.

```json
{
  "id": "string (UUID)",
  "uid": "string (Foreign Key -> users.uid)",
  "mood": "string (Focused | Stressed | Tired | Energetic | Calm)",
  "loggedAt": "timestamp"
}

```

### `focus_sessions`

Tracks deep work blocks, Pomodoro cycles, and interruptions.

```json
{
  "id": "string (UUID)",
  "uid": "string (Foreign Key -> users.uid)",
  "taskId": "string (nullable -> tasks.id)",
  "durationMinutes": "number",
  "interruptionsCount": "number",
  "ambientSoundUsed": "string",
  "completedAt": "timestamp"
}

```

### `analytics_daily` & `analytics_weekly`

Aggregated telemetry data powering charts and Kairo's daily briefings.

```json
{
  "id": "string (UUID)",
  "uid": "string (Foreign Key -> users.uid)",
  "dateWindow": "string (YYYY-MM-DD or YYYY-WXX)",
  "completedTasksCount": "number",
  "skippedTasksCount": "number",
  "averageFocusScore": "number (float)",
  "totalHoursWorked": "number (float)",
  "deepWorkHours": "number (float)",
  "productivityScore": "number (float)",
  "calculatedAt": "timestamp"
}

```

### `chat_history` & `assistant_memory`

Stores conversational logs between the user and Kairo.

```json
{
  "id": "string (UUID)",
  "uid": "string (Foreign Key -> users.uid)",
  "role": "string (user | assistant)",
  "message": "string",
  "contextSnapshot": "map (scheduled tasks, active focus state)",
  "timestamp": "timestamp"
}

```

---

## 2. Supabase PGVector Schema (Long-Term Vector Memory)

To support semantic searches (e.g., *"What was that startup idea from three months ago?"*), text chunks are embedded and stored in PostgreSQL using the `pgvector` extension.

### Table: `vector_embeddings`

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE vector_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- ('task', 'chat', 'brain_dump', 'note')
    source_id VARCHAR(255) NOT NULL,   -- Reference ID from Firestore
    content TEXT NOT NULL,             -- The actual text chunk
    embedding VECTOR(384)              -- 384 dimensions for lightweight Sentence Transformers (e.g., all-MiniLM-L6-v2)
);

-- Index for fast cosine similarity vector search
CREATE INDEX ON vector_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

```

---

## 3. Redis Caching Schema (Fast State & Rate Limiting)

Redis is utilized in the backend for rapid caching of active user states, session tokens, and FastAPI API rate limiting.

* **Key:** `user:session:{uid}` $\rightarrow$ **Value:** JSON string of user session context and active task cache.
* **Key:** `ml:prediction:cache:{task_id}` $\rightarrow$ **Value:** Cached XGBoost/Random Forest prediction probabilities (TTL: 1 hour).
* **Key:** `rate_limit:groq:{uid}` $\rightarrow$ **Value:** Request counter for LLM token usage control.