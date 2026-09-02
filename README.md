<div align="center">

<img src="./logo.png" alt="Saarathi Logo" width="120" style="border-radius: 24px; margin-bottom: 16px;" onerror="this.src='https://api.iconify.design/lucide:cpu.svg?color=%236366F1&width=64&height=64'" />

# Saarathi & Kairo
### The Autonomous Personal Productivity Operating System

<p align="center">
  <strong>An AI-driven personal OS that learns your behavioral patterns, predicts procrastination, intelligently orchestrates your schedule, and features Kairo — an executive voice AI companion.</strong>
</p>

<p align="center">
  <a href="#-demo--media"><img src="https://img.shields.io/badge/Demo-Live_Preview-6366F1?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Demo" /></a>
  <a href="#-technology-stack--ecosystem"><img src="https://img.shields.io/badge/Stack-React_Native_|_Vite_|_FastAPI-10B981?style=for-the-badge" alt="Stack" /></a>
  <a href="https://github.com/siddharthg-7/Saarathi/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-3B82F6?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active_Development-6366F1?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/Platform-iOS_|_Android_|_Web-10B981?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/AI_Engine-Llama_3.3_|_Deepgram-F59E0B?style=flat-square" alt="AI Engine" />
  <img src="https://img.shields.io/badge/Database-Firestore_|_Supabase_PGVector-06B6D4?style=flat-square" alt="Database" />
</p>

</div>

---

## <img src="https://api.iconify.design/lucide:book-open.svg?color=%236366F1&width=22&height=22" width="22" height="22" style="vertical-align: middle; margin-right: 6px;" /> Description

**Saarathi** is a next-generation productivity operating system designed to bridge the gap between human intention and execution. Rather than acting as a static to-do list, Saarathi acts as an autonomous life companion that understands your cognitive energy levels, detects early signs of burnout and task avoidance, and dynamically recalibrates your day.

At the core of the ecosystem is **Kairo** — a calm, context-aware AI assistant inspired by executive personal aides. Kairo doesn't just respond to prompts; it observes user habits, synthesizes unstructured voice brain dumps into structured projects, reasons over long-term vector memories, and executes real actions seamlessly across mobile and web.

---

## <img src="https://api.iconify.design/lucide:play-circle.svg?color=%23EF4444&width=22&height=22" width="22" height="22" style="vertical-align: middle; margin-right: 6px;" /> Demo & Media

> Experience Saarathi and Kairo in action. Use the links below to test the live deployments or watch feature walkthroughs.

| Resource | Link | Details |
| :--- | :--- | :--- |
| <img src="https://api.iconify.design/lucide:globe.svg?color=%236366F1&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Live Web App** | [![Web Demo](https://img.shields.io/badge/Launch-Web_Dashboard-6366F1?style=flat-square&logo=google-chrome&logoColor=white)](https://your-saarathi-web-demo.vercel.app) | Full-featured desktop web application (Vite + React) |
| <img src="https://api.iconify.design/lucide:video.svg?color=%23EF4444&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Video Walkthrough** | [![Video Demo](https://img.shields.io/badge/Watch-2--Min_Product_Demo-EF4444?style=flat-square&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=your-demo-video-id) | Overview of Kairo AI, Voice Brain Dump & ML Insights |
| <img src="https://api.iconify.design/lucide:smartphone.svg?color=%2310B981&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Mobile App (Expo)** | [![Expo Preview](https://img.shields.io/badge/Preview-Expo_Go_Project-000000?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/@your-org/saarathi) | Interactive cross-platform mobile client (iOS / Android) |
| <img src="https://api.iconify.design/lucide:file-code.svg?color=%23009688&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **API Docs (Swagger)** | [![FastAPI Docs](https://img.shields.io/badge/Explore-Swagger_UI-009688?style=flat-square&logo=fastapi&logoColor=white)](http://localhost:8000/docs) | Interactive OpenAPI specifications and endpoints |

---

## <img src="https://api.iconify.design/lucide:sparkles.svg?color=%23F59E0B&width=22&height=22" width="22" height="22" style="vertical-align: middle; margin-right: 6px;" /> Features & Deep-Dive

Saarathi combines modern user interface design, behavioral machine learning, voice intelligence, and fault-tolerant architecture to deliver an end-to-end personal productivity ecosystem.

| Module | Core Capability | Tech Powering It |
| :--- | :--- | :--- |
| [**Kairo AI Assistant**](#1-kairo-ai--autonomous-executive-voice-companion) | Autonomous voice & chat companion, context reasoning, and tool execution | Groq LLaMA 3.3, Deepgram STT/TTS, FastAPI |
| [**Predictive ML & XAI**](#2-predictive-ml-engine--explainable-ai-xai) | Procrastination risk, energy clustering, burnout detection & factor attribution | Scikit-Learn, XGBoost, KMeans, SHAP/XAI |
| [**Voice Brain Dump**](#3-voice-brain-dump-pipeline) | Unstructured monologue transcription & multi-task automatic breakdown | Deepgram Nova-2, Groq LLM, Firestore |
| [**Smart Task Matrix**](#4-multi-dimensional-task-matrix--daily-agenda) | Energy, difficulty, urgency mapping, Kanban, and dynamic Today view | Zustand, React 18, React Native |
| [**Vector Memory Vault**](#5-semantic-vector-memory-vault) | Long-term contextual memory retrieval across conversations and notes | Supabase `pgvector`, Sentence Transformers |
| [**Zen Focus Room**](#6-zen-focus-room--habit-momentum-os) | Pomodoro & flow timers, ambient audio soundscapes, and streak heatmaps | Web Audio API, Reanimated, Victory Native |
| [**Goal Hierarchy**](#7-hierarchical-goals--milestone-alignment) | Long-term vision decomposed into linked weekly actionable deliverables | Firestore, AI Decomposition Engine |
| [**Smart Notifications**](#8-smart-notifications--adaptive-snooze-engine) | Cross-device alerts with cognitive energy-aware intelligent snoozing | Web Push, Expo Notifications, Service Workers |
| [**Resilience & Offline**](#9-enterprise-resilience--offline-first-architecture) | Circuit breakers, offline action queue, and auto-reconnecting WebSockets | Custom Circuit Breaker, IndexedDB, Axios |

---

### <img src="https://api.iconify.design/lucide:bot.svg?color=%236366F1&width=20&height=20" width="20" height="20" style="vertical-align: middle; margin-right: 6px;" /> 1. Kairo AI — Autonomous Executive Voice Companion

Kairo is built around the interaction philosophy of an executive personal aide — calm, intelligent, context-aware, proactive, and concise. It is deeply integrated into your entire workspace rather than functioning as an isolated chatbot.

```
                    ┌─────────────────────────┐
                    │   User Voice / Prompt   │
                    └────────────┬────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Kairo Context Engine                      │
│   • Active Schedule & Overdue Tasks    • Current Energy State   │
│   • Semantic Vector Memories           • Behavioral ML Profile  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Groq LLaMA 3.3 Engine                     │
│               Reasoning · Tool Calls · Formatted Reply          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌───────────────────┐           ┌───────────────────┐
       │   Direct Action   │           │   Voice Output    │
       │  Execution Engine │           │   Deepgram TTS    │
       │ (Tasks/Goals/Rem) │           │ (Natural Audio)   │
       └───────────────────┘           └───────────────────┘
```

* **Proactive Context Awareness**: When you speak with Kairo, it already knows your active schedule, current energy level, overdue tasks, and historical habits without needing repetitive context.
* **Autonomous Tool Execution**: Safely performs real workspace modifications via structured tool calls:
  * `create_task`: Schedules tasks with inferred energy, priority, and due dates.
  * `update_task` / `delete_task`: Reschedules or modifies tasks conversationally.
  * `create_reminder` / `snooze_reminder`: Configures time-based or energy-based alerts.
  * `create_goal`: Establishes long-term goals with automatic milestone breakdowns.
* **Low-Latency Voice Stream**: Real-time voice interaction combining Deepgram Nova-2 speech recognition with instant streaming audio responses.
* **Anti-Robotic Persona**: Delivers actionable, witty, concise assistance without verbose AI pleasantries or boilerplate disclaimers.

---

### <img src="https://api.iconify.design/lucide:brain-circuit.svg?color=%23EC4899&width=20&height=20" width="20" height="20" style="vertical-align: middle; margin-right: 6px;" /> 2. Predictive ML Engine & Explainable AI (XAI)

Saarathi replaces guesswork with data-driven behavioral intelligence, training models on user telemetry to anticipate obstacles before they cause delays.

<div align="center">
  <img src="https://img.shields.io/badge/ML_Algorithm-XGBoost_|_K--Means_|_Isolation_Forest-FF6F00?style=flat-square" alt="ML Stack" />
  <img src="https://img.shields.io/badge/Explainability-SHAP_Feature_Attribution-0288D1?style=flat-square" alt="XAI" />
</div>

* **Procrastination & Delay Risk Predictor**:
  * Evaluates individual tasks against postpone history, estimated cognitive load, energy requirements, and time of day.
  * Calculates exact **Completion Probability (%)**, **Delay Probability (%)**, and **Skip Risk Score**.
  * Classifies tasks into `Low`, `Medium`, and `High Risk` with immediate visual flags.
* **Cognitive Energy Dynamic Clustering (K-Means)**:
  * Analyzes historical task completion velocities across 24-hour cycles.
  * Identifies the user's authentic peak focus windows (Morning, Afternoon, or Evening) to align difficult tasks with peak mental acuity.
* **Smart Time-Slot Recommender**:
  * Cross-references task difficulty with the user’s learned energy curve to suggest optimal execution time blocks.
* **Burnout & Workload Anomaly Detection (Isolation Forest)**:
  * Detects velocity dips, backlog accumulation, and high-energy task clustering to warn users before mental exhaustion sets in.
* **Explainable AI (XAI) Factor Attribution**:
  * Provides transparent explanations for why a task was flagged (e.g., *"Postponed 3 times + High Energy required during an Afternoon low-energy dip"*).
  * Offers concrete mitigation strategies (e.g., *"Break into two 20-minute subtasks and move to 10:00 AM"*).

---

### <img src="https://api.iconify.design/lucide:mic.svg?color=%238B5CF6&width=20&height=20" width="20" height="20" style="vertical-align: middle; margin-right: 6px;" /> 3. Voice "Brain Dump" Pipeline

Turn fragmented thoughts, chaotic meetings, or rambling voice notes into structured, prioritized project backlogs in seconds.

* **Stream-of-Consciousness Recording**: Speak freely for minutes without structuring thoughts; capture messy ideas whenever inspiration strikes.
* **High-Accuracy Speech-to-Text**: Powered by Deepgram Nova-2 with automatic punctuation, smart formatting, and domain terminology recognition.
* **Intelligent Entity Decomposition**: An AI extraction pipeline parses the monologue and produces atomic task cards with:
  * Clean, imperative task titles and actionable descriptions.
  * Inferred **Priority** (`Low`, `Medium`, `High`, `Urgent`).
  * Inferred **Energy Level** (`Low`, `Medium`, `High`).
  * Inferred **Category** (`Coding`, `Work`, `Personal`, `Fitness`, `Finance`, `Admin`).
  * Inferred **Estimated Duration** and **Due Date**.
* **Interactive Staging & 1-Click Commit**: Review, edit, or toggle extracted tasks in a preview tray before committing them directly to Firestore.

---

### <img src="https://api.iconify.design/lucide:layout-grid.svg?color=%233B82F6&width=20&height=20" width="20" height="20" style="vertical-align: middle; margin-right: 6px;" /> 4. Multi-Dimensional Task Matrix & Daily Agenda

Saarathi reimagines task management with deep metadata designed around human cognitive capability.

* **Multi-Dimensional Task Cards**:
  * **Cognitive Energy Required**: Low (Routine), Medium (Active), High (Deep Work).
  * **Difficulty Scale**: 1 to 5 scale representing complexity and mental resistance.
  * **Urgency & Priority**: Eisenhower matrix classification (Urgent/Important).
  * **Postpone Counter**: Automatic telemetry tracking how many times a task was rescheduled.
* **Dynamic "Today" View**:
  * An AI-optimized daily agenda that automatically re-sequences tasks based on your current energy and elapsed time.
  * Includes a **Morning Briefing** with top priorities, risk warnings, and quick win suggestions.
* **Flexible Visual Workflows**:
  * **Kanban Board**: Drag-and-drop workflow (`To Do`, `In Progress`, `Blocked`, `Done`).
  * **Eisenhower Quad**: Matrix visualization sorting urgent vs important quadrant priorities.
  * **Calendar Time-Blocking**: Synchronized day and week schedule views with duration snapping.

---

### <img src="https://api.iconify.design/lucide:database.svg?color=%2306B6D4&width=20&height=20" width="20" height="20" style="vertical-align: middle; margin-right: 6px;" /> 5. Semantic Vector Memory Vault

Never lose a piece of context, preference, or past decision. Saarathi integrates a dedicated semantic memory engine.

* **Supabase `pgvector` Architecture**: High-dimensional vector indexing using dense Sentence Transformer embeddings (`all-MiniLM-L6-v2`).
* **Automated Knowledge Extraction**: Automatically harvests long-term user facts from chats, brain dumps, and completed milestones:
  * Work preferences (*"Prefers deep coding sessions in the early morning"*).
  * Recurring commitments (*"Has team standup every Tuesday at 10 AM"*).
  * Personal habits (*"Goes to the gym after 6 PM"*).
* **Instant Semantic Search**: Search your entire life history using natural language concepts rather than rigid keyword matches.
* **Assistant Context Injection**: Kairo seamlessly pulls relevant past memories into the conversation context window during planning sessions.

---

### <img src="https://api.iconify.design/lucide:timer.svg?color=%2310B981&width=20&height=20" width="20" height="20" style="vertical-align: middle; margin-right: 6px;" /> 6. Zen Focus Room & Habit Momentum OS

Designed to eliminate digital friction and keep you in deep flow.

* **Zen Focus Room**:
  * Minimalist Pomodoro and custom open-ended Flow timers.
  * Integrated **Ambient Soundscapes**: Binaural focus beats, soft rainfall, white noise, and coffee shop ambiance.
  * Distraction-blocking interface with full-screen immersive mode.
* **Habit Consistency Engine**:
  * Track daily and weekly recurring habit rituals with target frequency targets.
  * **Streak & Momentum Tracking**: Visual activity heatmaps (GitHub-style contribution grid).
  * **Momentum Protection**: Grace period algorithms to prevent broken streaks from disrupting long-term momentum.
* **Focus Telemetry**: Logs actual focused time against estimated task durations to improve future ML duration estimation accuracy.

---

### <img src="https://api.iconify.design/lucide:target.svg?color=%23F59E0B&width=20&height=20" width="20" height="20" style="vertical-align: middle; margin-right: 6px;" /> 7. Hierarchical Goals & Milestone Alignment

Connect your minute-to-minute tasks to your 5-year vision.

* **Tiered Goal Architecture**: Organize aspirations into **Vision** → **Objectives** → **Milestones** → **Actionable Tasks**.
* **Dynamic Progress Calculation**: Automatically recalculates milestone and goal completion percentages as linked daily tasks are checked off.
* **AI Goal Decomposition**: Ask Kairo to break down ambitious goals (e.g., *"Prepare for AWS Solutions Architect Certification"*) into weekly actionable sprints.

---

### <img src="https://api.iconify.design/lucide:bell.svg?color=%23F43F5E&width=20&height=20" width="20" height="20" style="vertical-align: middle; margin-right: 6px;" /> 8. Smart Notifications & Adaptive Snooze Engine

Notifications that respect your focus rather than fragmenting your attention.

* **Cross-Platform Delivery**: Synchronized notifications across Web Push and Mobile Native (iOS / Android Expo push tokens).
* **Cognitive Energy-Aware Snoozing**:
  * <img src="https://api.iconify.design/lucide:sun.svg?color=%23F59E0B&width=14&height=14" width="14" height="14" style="vertical-align: middle;" /> **Snooze to Next High-Energy Window**: Re-alerts you when your cognitive curve indicates optimal focus.
  * <img src="https://api.iconify.design/lucide:sunrise.svg?color=%23F59E0B&width=14&height=14" width="14" height="14" style="vertical-align: middle;" /> **Snooze to Tomorrow Morning**: Postpones non-essential alerts to the start of the next workday.
  * <img src="https://api.iconify.design/lucide:clock.svg?color=%233B82F6&width=14&height=14" width="14" height="14" style="vertical-align: middle;" /> **Quick Snooze**: Standard +15m, +1h, or +3h options.
* **Quiet Hours & Fatigue Safeguards**: Intelligent throttling prevents notification spam during active focus sessions and late-night hours.

---

### <img src="https://api.iconify.design/lucide:shield-check.svg?color=%2310B981&width=20&height=20" width="20" height="20" style="vertical-align: middle; margin-right: 6px;" /> 9. Enterprise Resilience & Offline-First Architecture

Engineered for 99.9% availability, graceful degradation, and uninterrupted offline workflows.

* **Backend Circuit Breakers**:
  * Monitors health and error rates across external AI providers (Groq, Deepgram, Supabase).
  * Automatically trips and routes requests to fallback heuristic engines when external APIs experience outages.
* **Resilient WebSocket Channels**:
  * Features exponential backoff, jittered reconnects, heartbeat health checks, and packet queueing.
* **Offline Action Queue**:
  * Queue task creations, completions, and edits locally in IndexedDB / AsyncStorage when disconnected.
  * Automatically reconciles and syncs state upon internet reconnection.
* **Zero-Trust Security**:
  * Enforces strict HTTP Security Headers (`nosniff`, `DENY` clickjacking, strict CSP).
  * Comprehensive token validation and user identity isolation across all database operations.

---

## <img src="https://api.iconify.design/lucide:layers.svg?color=%236366F1&width=22&height=22" width="22" height="22" style="vertical-align: middle; margin-right: 6px;" /> Technology Stack & Ecosystem

Saarathi leverages a modern, full-stack reactive architecture designed for rapid cross-platform synchronization, asynchronous intelligence pipelines, and high fault tolerance.

### <img src="https://api.iconify.design/lucide:layout.svg?color=%233B82F6&width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 6px;" /> Frontend & Cross-Platform Clients

| Layer / Technology | Version / Spec | Purpose & Architectural Role |
| :--- | :--- | :--- |
| <img src="https://api.iconify.design/logos:react.svg?width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **React Native & Expo** | SDK 51+ / Expo Router | Cross-platform native mobile experience with file-based routing and native device bridge. |
| <img src="https://api.iconify.design/logos:vitejs.svg?width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **React 18 & Vite** | Vite 5.x / React 18 | Desktop web application providing sub-second HMR and optimized production bundles. |
| <img src="https://api.iconify.design/logos:tailwindcss-icon.svg?width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Tailwind CSS & NativeWind** | v3.4+ / NativeWind v4 | Unified utility-first styling system implementing sleek dark mode and glassmorphism. |
| <img src="https://api.iconify.design/logos:typescript-icon.svg?width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **TypeScript** | v5.4+ | End-to-end type safety, shared interfaces, and structured data contracts across the monorepo. |
| <img src="https://api.iconify.design/lucide:box.svg?color=%23EC4899&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Zustand** | v4.5+ | Ultra-lightweight reactive client state management with local persistence and offline hydration. |
| <img src="https://api.iconify.design/lucide:activity.svg?color=%2310B981&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Victory Native / Reanimated** | v36+ / Reanimated 3 | High-performance 60fps gesture animations and interactive productivity telemetry charts. |

---

### <img src="https://api.iconify.design/lucide:server.svg?color=%23F59E0B&width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 6px;" /> Backend, AI Gateway & Microservices

| Technology | Framework / Engine | Purpose & Architectural Role |
| :--- | :--- | :--- |
| <img src="https://api.iconify.design/logos:fastapi.svg?width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **FastAPI** | Python 3.11+ / Uvicorn | Asynchronous, high-concurrency REST gateway with automatic OpenAPI documentation. |
| <img src="https://api.iconify.design/logos:pydantic.svg?width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Pydantic v2** | Rust-backed validation | Strict input sanitization, runtime schema validation, and JSON serialization. |
| <img src="https://api.iconify.design/lucide:cpu.svg?color=%23EF4444&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Groq LLaMA 3.3 70B** | LPUs / Inference Engine | Natural language understanding, conversational planning, and structured tool calling. |
| <img src="https://api.iconify.design/lucide:mic-2.svg?color=%238B5CF6&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Deepgram Nova-2** | Streaming STT & TTS | Low-latency speech recognition and voice synthesis for real-time voice conversations. |

---

### <img src="https://api.iconify.design/lucide:brain.svg?color=%23EC4899&width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 6px;" /> Machine Learning, Data & Vector Infrastructure

| Component | Library / Service | Purpose & Architectural Role |
| :--- | :--- | :--- |
| <img src="https://api.iconify.design/logos:python.svg?width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Scikit-Learn & XGBoost** | Scikit-Learn 1.4+ / XGBoost | Behavioral classifiers for procrastination prediction and K-Means energy clustering. |
| <img src="https://api.iconify.design/lucide:search.svg?color=%233B82F6&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Sentence Transformers** | `all-MiniLM-L6-v2` | Dense vector embedding generation for semantic memory indexing and document similarity. |
| <img src="https://api.iconify.design/logos:supabase-icon.svg?width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Supabase & PGVector** | PostgreSQL + pgvector | High-dimensional vector storage and cosine distance similarity search queries. |
| <img src="https://api.iconify.design/logos:firebase.svg?width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Firebase Suite** | Firestore & Firebase Auth | Real-time multi-device document synchronization and secure identity authentication. |
| <img src="https://api.iconify.design/logos:docker-icon.svg?width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Docker & Compose** | Container Runtime | Reproducible containerized environments for backend services, tests, and CI/CD pipelines. |

---

## <img src="https://api.iconify.design/lucide:image.svg?color=%233B82F6&width=22&height=22" width="22" height="22" style="vertical-align: middle; margin-right: 6px;" /> Screenshots & Visual Showcase

> High-resolution interface captures from the Saarathi web workstation and mobile client. Asset files are stored in `docs/assets/screenshots/`.

| Web Application Dashboard | Kairo Voice & AI Assistant |
| :---: | :---: |
| <img src="./docs/assets/screenshots/web-dashboard.png" alt="Web Dashboard" width="100%" onerror="this.src='https://via.placeholder.com/800x450/0A0A0A/6366F1?text=Web+Dashboard+%26+Task+Matrix'" /> | <img src="./docs/assets/screenshots/kairo-voice-modal.png" alt="Kairo Voice Modal" width="100%" onerror="this.src='https://via.placeholder.com/800x450/0A0A0A/8B5CF6?text=Kairo+Voice+Assistant'" /> |
| *Multi-dimensional task matrix, Kanban board & dynamic Today view* | *Low-latency voice interaction, contextual planning & tool execution* |

| Predictive ML & XAI Analytics | Voice Brain Dump Studio |
| :---: | :---: |
| <img src="./docs/assets/screenshots/ml-analytics.png" alt="ML Analytics" width="100%" onerror="this.src='https://via.placeholder.com/800x450/0A0A0A/EC4899?text=Predictive+ML+%26+Energy+Clustering'" /> | <img src="./docs/assets/screenshots/brain-dump-studio.png" alt="Brain Dump Studio" width="100%" onerror="this.src='https://via.placeholder.com/800x450/0A0A0A/F59E0B?text=Voice+Brain+Dump+Pipeline'" /> |
| *Procrastination risk forecasting, 24h energy curves & SHAP factor insights* | *Stream-of-consciousness audio capture & automatic atomic task breakdown* |

| Mobile Focus Room & Flow Timer | Habit Momentum & Consistency Heatmap |
| :---: | :---: |
| <img src="./docs/assets/screenshots/mobile-focus-room.png" alt="Mobile Focus Room" width="100%" onerror="this.src='https://via.placeholder.com/800x450/0A0A0A/10B981?text=Zen+Focus+Room'" /> | <img src="./docs/assets/screenshots/habit-heatmaps.png" alt="Habit Heatmaps" width="100%" onerror="this.src='https://via.placeholder.com/800x450/0A0A0A/06B6D4?text=Habit+Consistency+OS'" /> |
| *Distraction-free Pomodoro session with ambient soundscapes* | *GitHub-style consistency heatmaps, streak trackers & velocity metrics* |

---

## <img src="https://api.iconify.design/lucide:download.svg?color=%2310B981&width=22&height=22" width="22" height="22" style="vertical-align: middle; margin-right: 6px;" /> Installation & Setup Guide

Follow the step-by-step instructions below to configure and run the entire Saarathi monorepo locally.

### <img src="https://api.iconify.design/lucide:clipboard-check.svg?color=%233B82F6&width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 6px;" /> 1. Prerequisites

Ensure your development environment meets the following specifications:

| Requirement | Minimum Version | Installation / Reference |
| :--- | :--- | :--- |
| **Node.js** | `v18.18.0` or `v20.x` | [nodejs.org](https://nodejs.org/) |
| **npm** / **pnpm** | `v9.x` or higher | Included with Node.js (`npm install -g npm`) |
| **Python** | `v3.10` or `v3.11` | [python.org](https://python.org/) |
| **Git** | `v2.40+` | [git-scm.com](https://git-scm.com/) |
| **Expo CLI** (Optional) | Latest | `npm install -g expo-cli` |
| **Docker & Compose** (Optional) | `v24+` | [docker.com](https://docker.com/) |

---

### <img src="https://api.iconify.design/lucide:git-branch.svg?color=%236366F1&width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 6px;" /> 2. Clone the Repository

```bash
git clone https://github.com/siddharthg-7/Saarathi.git
cd Saarathi
```

---

### <img src="https://api.iconify.design/lucide:package.svg?color=%23F59E0B&width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 6px;" /> 3. Install Monorepo Dependencies

Install workspace dependencies for the root, web dashboard, mobile application, and shared TypeScript packages:

```bash
# Install all JavaScript / TypeScript workspace dependencies
npm install
```

---

### <img src="https://api.iconify.design/lucide:database.svg?color=%2306B6D4&width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 6px;" /> 4. Database & PGVector Schema Setup

1. **Firestore Rules & Indexes**:
   Deploy Firestore security rules and composite indexes to your Firebase project:
   ```bash
   npx firebase deploy --only firestore:rules,firestore:indexes
   ```
2. **Supabase PGVector Migration**:
   Execute the migration script in `supabase/migrations/` inside your Supabase SQL Editor to enable `pgvector` and initialize the embeddings table:
   ```sql
   create extension if not exists vector;
   ```

---

### <img src="https://api.iconify.design/lucide:terminal.svg?color=%2310B981&width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 6px;" /> 5. Launch Development Services

Open separate terminal windows or run services concurrently:

#### Terminal 1 — Start Python AI Backend Gateway:
```bash
cd backend
python -m venv .venv

# Activate virtual environment:
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
> API Gateway active at: **`http://localhost:8000`** | Swagger Docs at: **`http://localhost:8000/docs`**

#### Terminal 2 — Start Web Dashboard:
```bash
cd apps/web
npm run dev
```
> Web Dashboard active at: **`http://localhost:5173`**

#### Terminal 3 — Start Mobile Application (Expo):
```bash
cd apps/mobile
npx expo start
```
> Press **`a`** for Android Emulator, **`i`** for iOS Simulator, or scan the QR code using the **Expo Go** app on your physical device.

---

### <img src="https://api.iconify.design/logos:docker-icon.svg?width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 6px;" /> 6. Docker Containerized Setup (Alternative)

To spin up the backend gateway and containerized services using Docker Compose:

```bash
docker compose up --build
```

---

## <img src="https://api.iconify.design/lucide:key-round.svg?color=%2306B6D4&width=22&height=22" width="22" height="22" style="vertical-align: middle; margin-right: 6px;" /> Environment Variables & Secrets Reference

Saarathi strictly enforces a multi-tier security model classifying configuration into **Server Secrets**, **Server Config**, and **Public Client Config**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                ENVIRONMENT SECURITY TIERS                              │
│                                                                                        │
│   [Server Secrets] (Never Exposed): GROQ_API_KEY, DEEPGRAM_API_KEY, SUPABASE_SECRET   │
│   [Server Config]  (Host/Port/CORS): ENVIRONMENT, PORT, CORS_ALLOWED_ORIGINS           │
│   [Client Config]  (App Bundled):   VITE_FIREBASE_*, EXPO_PUBLIC_FIREBASE_*           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### <img src="https://api.iconify.design/logos:fastapi.svg?width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 6px;" /> 1. Backend Gateway (`backend/.env`)

Create `backend/.env` (or copy from `.env.example` in repository root):

```env
# Server Runtime
ENVIRONMENT=development
PORT=8000
HOST=0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8081

# AI Orchestration & Voice Services
GROQ_API_KEY=gsk_your_groq_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here
GEMINI_API_KEY=AIzaSy_optional_gemini_key

# Supabase Vector Memory Vault
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Firebase Admin SDK Authentication
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}

# Administrative Access & Caching
ADMIN_EMAILS=admin@saarathi.app
ADMIN_UIDS=admin_saarathi_root
REDIS_URL=redis://default:password@localhost:6379
```

| Variable Name | Type | Classification | Default / Example | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | `string` | **Server Secret** *(Required)* | `gsk_...` | API key for Groq Cloud running LLaMA 3.3 70B inference for Kairo AI. |
| `DEEPGRAM_API_KEY` | `string` | **Server Secret** *(Required)* | `...` | API key for Deepgram Nova-2 streaming Speech-to-Text & Text-to-Speech. |
| `GEMINI_API_KEY` | `string` | **Server Secret** *(Optional)* | `AIzaSy...` | Fallback multimodal LLM and audio transcription engine. |
| `SUPABASE_URL` | `string` | **Server Config** *(Required)* | `https://xyz.supabase.co` | Supabase project URL hosting the PostgreSQL database with `pgvector`. |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | **Server Secret** *(Required)* | `eyJhbGciOi...` | Supabase Service Role key used for vector embedding storage & similarity search. |
| `FIREBASE_PROJECT_ID` | `string` | **Public Config** *(Required)* | `saarathi-os` | Google Firebase Project ID for Firestore and Authentication verification. |
| `FIREBASE_CREDENTIALS_JSON` | `json_string` | **Server Secret** *(Required)* | `{"type":"service_account",...}` | Raw JSON content of the Firebase Admin Service Account key for cloud deployments. |
| `GOOGLE_APPLICATION_CREDENTIALS` | `filepath` | **Server Secret** *(Alternative)* | `path/to/serviceAccountKey.json` | Local file path to Firebase Admin Service Account key (alternative to JSON string). |
| `ENVIRONMENT` | `string` | **Server Config** | `development` | Runtime environment mode (`development`, `staging`, or `production`). |
| `PORT` | `integer` | **Server Config** | `8000` | Port on which the FastAPI Uvicorn server listens. |
| `HOST` | `string` | **Server Config** | `0.0.0.0` | Host IP binding address for the FastAPI backend gateway. |
| `CORS_ALLOWED_ORIGINS` | `csv_string` | **Server Config** | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed CORS origins for web and mobile clients. |
| `ADMIN_EMAILS` | `csv_string` | **Server Config** | `admin@saarathi.app` | Comma-separated list of administrative email addresses for elevated permissions. |
| `ADMIN_UIDS` | `csv_string` | **Server Config** | `admin-uid-1,admin-uid-2` | Comma-separated list of Firebase UIDs granted superuser roles. |
| `REDIS_URL` | `string` | **Server Config** *(Optional)* | `redis://default:pass@host:6379` | Redis connection URL for distributed task queuing and telemetry caching. |

---

### <img src="https://api.iconify.design/logos:vitejs.svg?width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 6px;" /> 2. Web Application (`apps/web/.env`)

Create `apps/web/.env` (or copy from `apps/web/.env.example`):

```env
# Backend API Gateway URL
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/v1

# Firebase Client Web SDK
VITE_FIREBASE_API_KEY=AIzaSyYourFirebaseWebApiKey
VITE_FIREBASE_AUTH_DOMAIN=saarathi-os.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=saarathi-os
VITE_FIREBASE_STORAGE_BUCKET=saarathi-os.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# App Configuration
VITE_APP_NAME=Saarathi OS
VITE_ENABLE_MOCK_FALLBACK=true
```

| Variable Name | Type | Classification | Default / Example | Description |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `string` | **Public Client** *(Required)* | `http://localhost:8000` | Base URL pointing to the FastAPI Python backend gateway. |
| `VITE_API_BASE_URL` | `string` | **Public Client** *(Alternative)* | `http://localhost:8000/v1` | Versioned endpoint path for backend REST and WebSocket routes. |
| `VITE_FIREBASE_API_KEY` | `string` | **Public Client** *(Required)* | `AIzaSy...` | Firebase Web API key for client-side authentication. |
| `VITE_FIREBASE_AUTH_DOMAIN` | `string` | **Public Client** *(Required)* | `saarathi-os.firebaseapp.com` | Firebase Authentication domain. |
| `VITE_FIREBASE_PROJECT_ID` | `string` | **Public Client** *(Required)* | `saarathi-os` | Firebase Project ID matching the backend Firestore database. |
| `VITE_FIREBASE_STORAGE_BUCKET`| `string` | **Public Client** *(Required)* | `saarathi-os.firebasestorage.app` | Firebase Storage bucket for audio uploads and user assets. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `string` | **Public Client** *(Required)* | `123456789012` | Firebase Cloud Messaging (FCM) sender ID for web push notifications. |
| `VITE_FIREBASE_APP_ID` | `string` | **Public Client** *(Required)* | `1:123456789012:web:...` | Firebase Web Application ID. |
| `VITE_ENABLE_MOCK_FALLBACK` | `boolean` | **Public Client** | `true` | Enables offline heuristic mock simulation if backend gateway is unreachable. |

---

### <img src="https://api.iconify.design/logos:react.svg?width=18&height=18" width="18" height="18" style="vertical-align: middle; margin-right: 4px;" /> 3. Mobile Application (`apps/mobile/.env`)

Create `apps/mobile/.env` (or copy from `apps/mobile/.env.example`):

```env
# Backend API Gateway URL (Use LAN IP for physical device testing)
EXPO_PUBLIC_API_URL=http://localhost:8000

# Firebase Client Mobile SDK
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyYourFirebaseMobileApiKey
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=saarathi-os.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=saarathi-os
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=saarathi-os.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:android:abcdef123456
```

| Variable Name | Type | Classification | Default / Example | Description |
| :--- | :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | `string` | **Public Client** *(Required)* | `http://localhost:8000` | Backend API URL (use LAN IP `http://192.168.x.x:8000` when testing on physical devices). |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `string` | **Public Client** *(Required)* | `AIzaSy...` | Firebase Mobile API key for iOS & Android native client. |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `string` | **Public Client** *(Required)* | `saarathi-os.firebaseapp.com` | Firebase Authentication domain for mobile OAuth flows. |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `string` | **Public Client** *(Required)* | `saarathi-os` | Firebase Project ID for mobile Firestore synchronization. |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`| `string` | **Public Client** *(Required)* | `saarathi-os.firebasestorage.app` | Firebase Storage bucket for mobile voice recordings. |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `string` | **Public Client** *(Required)* | `123456789012` | FCM / APNs sender ID for native mobile push notifications. |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `string` | **Public Client** *(Required)* | `1:123456789012:android:...` | Firebase Mobile App ID. |

---

## <img src="https://api.iconify.design/lucide:network.svg?color=%233B82F6&width=22&height=22" width="22" height="22" style="vertical-align: middle; margin-right: 6px;" /> System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT ECOSYSTEM                                     │
│     [React Native Mobile Client]                 [Vite + React 18 Web Dashboard]       │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                       Firebase Auth & Realtime Sync Engine
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            FASTAPI PYTHON BACKEND GATEWAY                              │
│         (Security Headers · JWT Verification · Resilience Circuit Breakers)            │
└──────┬───────────────────────┬─────────────────────────┬────────────────────────┬──────┘
       │                       │                         │                        │
       ▼                       ▼                         ▼                        ▼
┌──────────────┐       ┌───────────────┐         ┌───────────────┐        ┌──────────────┐
│   Deepgram   │       │     Groq      │         │   ML Models   │        │   Supabase   │
│   STT / TTS  │       │   Llama 3.3   │         │ (XGBoost/SK)  │        │   PGVector   │
│ Voice Stream │       │ Orchestration │         │ Risk Engine   │        │ Vector Memory│
└──────────────┘       └───────────────┘         └───────────────┘        └──────────────┘
       │                       │                         │                        │
       └───────────────────────┴────────────┬────────────┴────────────────────────┘
                                            ▼
                             ┌─────────────────────────────┐
                             │    Firestore Operational    │
                             │      Real-Time Storage      │
                             └─────────────────────────────┘
```

---

## <img src="https://api.iconify.design/lucide:folder-tree.svg?color=%238B5CF6&width=22&height=22" width="22" height="22" style="vertical-align: middle; margin-right: 6px;" /> Monorepo Structure

```text
Saarathi/
├── apps/
│   ├── mobile/             # React Native (Expo) mobile application
│   │   ├── app/            # File-based navigation routes & screens
│   │   └── src/            # Mobile components, hooks, and native features
│   └── web/                # Vite + React.js desktop web dashboard
│       └── src/            # Web components, pages, visual dashboards, and modals
├── backend/                # FastAPI Python AI, ML, & Vector memory service
│   ├── app/
│   │   ├── api/            # Route controllers (Kairo, ML, Voice, Memory, Auth)
│   │   ├── core/           # Config, security, resilience, and circuit breakers
│   │   ├── models/         # Pydantic schemas & ML feature transformers
│   │   └── services/       # AI agents, vector indexing, and speech pipelines
│   └── tests/              # Backend test suites & circuit breaker assertions
├── packages/               # Shared TypeScript packages
│   ├── api/                # API client, WebSocket bridge & resilience monitors
│   ├── state/              # Shared Zustand stores (Auth, Tasks, Focus, Kairo)
│   └── types/              # Unified TypeScript interfaces & data contracts
├── supabase/               # PGVector database migrations & schema definitions
└── README.md
```

---

## <img src="https://api.iconify.design/lucide:flask-conical.svg?color=%23EC4899&width=22&height=22" width="22" height="22" style="vertical-align: middle; margin-right: 6px;" /> Testing & Quality Assurance

Execute test suites across the ecosystem to verify resilience and model stability:

```bash
# Run backend pytest suite with resilience assertions
cd backend
pytest -v

# Run workspace TypeScript lint and check
npm run lint
```

---

## <img src="https://api.iconify.design/lucide:scale.svg?color=%2364748B&width=22&height=22" width="22" height="22" style="vertical-align: middle; margin-right: 6px;" /> License

This project is licensed under the **MIT License** — see the [LICENSE](file:///c:/project-self-1/Saarathi/LICENSE) file for details.

---

<div align="center">
  <sub>Built with <img src="https://api.iconify.design/lucide:heart.svg?color=%23EF4444&width=14&height=14" width="14" height="14" style="vertical-align: middle;" /> for peak human focus and autonomous productivity.</sub>
</div>
