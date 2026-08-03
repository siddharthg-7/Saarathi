# AI & Machine Learning Workflow Diagrams: Saarathi & Kairo

These workflow diagrams illustrate the internal architecture and data processing pipelines for **Saarathi's** artificial intelligence, machine learning, and vector memory engines.

---

## 1. Voice-to-Task Brain Dump Pipeline

*How unstructured audio is transformed into structured, actionable tasks.*

```
[User Records Audio (Mobile/Web)]
       │
       ▼ (Multipart Audio Stream)
[FastAPI Backend Gateway]
       │
       ▼
[Deepgram Speech-to-Text (STT)] ──► Raw Transcript String
                                          │
                                          ▼
                         [Groq API (Llama 3.3 / Prompt Engineering)]
                                          ├── 1. Task & Subtask Extraction
                                          ├── 2. Priority & Deadline Detection
                                          ├── 3. Energy & Category Classification
                                          └── 4. Duplicate Removal & Normalization
                                          │
                                          ▼
                         [Structured JSON Task Payload]
                                          │
                                          ▼
                         [Firestore Batch Write & Sync]

```

---

## 2. Behavioral Prediction & Procrastination ML Pipeline

*How telemetry signals feed classical ML models to predict skip/delay probabilities.*

```
[User Action Events (Complete / Postpone / Skip / Focus)]
       │
       ▼
[Firestore Telemetry Loggers]
       │
       ▼ (Scheduled Celery Cron Job)
[Feature Store Aggregator (Pandas / NumPy)]
       ├── Extract Temporal Features (Day, Time, Duration)
       ├── Aggregate Environmental Context (Location, Energy, Mood)
       └── Calculate Historical Postpone Counts
       │
       ▼
[Scikit-Learn / XGBoost / CatBoost Prediction Engines]
       ├── Random Forest / XGBoost ──► Skip & Delay Probability
       └── KMeans Clustering        ──► Energy Window Mapping
       │
       ▼
[Explanation Generator (XAI)]
       │
       ▼
[Kairo Proactive Intervention / Transparent Notification]
> "You've skipped gym sessions on Monday nights 4 out of the last 5 weeks due to fatigue."

```

---

## 3. Long-Term Memory (RAG & Vector Search) Pipeline

*How user chats, notes, and brain dumps are stored and retrieved via semantic similarity.*

```
[User Inputs Chat, Note, or Brain Dump]
       │
       ▼
[FastAPI Embedding Engine]
       │
       ▼
[Sentence Transformers (e.g., all-MiniLM-L6-v2)]
       │
       ▼ (Generates 384-dimension Dense Vector)
[Supabase PGVector Database (`vector_embeddings` table)]
       │
       ▲ (Semantic Similarity Match via Cosine Distance)
[User Queries Kairo: "What was that startup idea from three months ago?"]
       │
       ▼
[FastAPI Vector Search Endpoint (`/memory/search`)]
       │
       ▼
[Groq LLM Context Augmentation & Synthesis]
       │
       ▼
[Instant, Context-Aware Answer Delivered to User]

```