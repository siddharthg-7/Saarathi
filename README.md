<div align="center">

<img src="./logo.png" alt="Saarathi Logo" width="120" style="border-radius: 24px; margin-bottom: 16px;" onerror="this.src='https://api.iconify.design/lucide:cpu.svg?color=%236366F1&width=64&height=64'" />

# Saarathi & Kairo
### The Autonomous Personal Productivity Operating System

<p align="center">
  <strong>An AI-driven personal OS that learns your behavioral patterns, predicts procrastination, intelligently orchestrates your schedule, and features Kairo — an executive voice AI companion.</strong>
</p>

<p align="center">
  <a href="#-demo--media"><img src="https://img.shields.io/badge/Demo-Live_Preview-6366F1?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Demo" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Stack-React_Native_|_Vite_|_FastAPI-10B981?style=for-the-badge" alt="Stack" /></a>
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

## 📖 Description

**Saarathi** is a next-generation productivity operating system designed to bridge the gap between human intention and execution. Rather than acting as a static to-do list, Saarathi acts as an autonomous life companion that understands your cognitive energy levels, detects early signs of burnout and task avoidance, and dynamically recalibrates your day.

At the core of the ecosystem is **Kairo** — a calm, context-aware AI assistant inspired by executive personal aides. Kairo doesn't just respond to prompts; it observes user habits, synthesizes unstructured voice brain dumps into structured projects, reasons over long-term vector memories, and executes real actions seamlessly across mobile and web.

---

## 🎬 Demo & Media

> Experience Saarathi and Kairo in action. Use the links below to test the live deployments or watch feature walkthroughs.

| Resource | Link | Details |
| :--- | :--- | :--- |
| 🌐 **Live Web App** | [![Web Demo](https://img.shields.io/badge/Launch-Web_Dashboard-6366F1?style=flat-square&logo=google-chrome&logoColor=white)](https://your-saarathi-web-demo.vercel.app) | Full-featured desktop web application (Vite + React) |
| 🎥 **Video Walkthrough** | [![Video Demo](https://img.shields.io/badge/Watch-2--Min_Product_Demo-EF4444?style=flat-square&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=your-demo-video-id) | Overview of Kairo AI, Voice Brain Dump & ML Insights |
| 📱 **Mobile App (Expo)** | [![Expo Preview](https://img.shields.io/badge/Preview-Expo_Go_Project-000000?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/@your-org/saarathi) | Interactive cross-platform mobile client (iOS / Android) |
| 📚 **API Docs (Swagger)**| [![FastAPI Docs](https://img.shields.io/badge/Explore-Swagger_UI-009688?style=flat-square&logo=fastapi&logoColor=white)](http://localhost:8000/docs) | Interactive OpenAPI specifications and endpoints |

### 🖼️ Visual Previews

```
┌──────────────────────────────────────────────┐  ┌──────────────────────────────────────────────┐
│             Web Analytics & Tasks            │  │          Kairo AI Assistant & Voice          │
│                                              │  │                                              │
│      [ Place Web Dashboard Screenshot ]      │  │     [ Place Kairo Voice Modal Screenshot ]   │
│                                              │  │                                              │
└──────────────────────────────────────────────┘  └──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐  ┌──────────────────────────────────────────────┐
│           Predictive ML & Energy Curve       │  │             Mobile Focus Experience          │
│                                              │  │                                              │
│     [ Place ML Procrastination Graph ]       │  │        [ Place Mobile App Screenshot ]       │
│                                              │  │                                              │
└──────────────────────────────────────────────┘  └──────────────────────────────────────────────┘
```

---

## ✨ Features & Deep-Dive

Saarathi combines modern user interface design, behavioral machine learning, voice intelligence, and fault-tolerant architecture to deliver an end-to-end personal productivity ecosystem.

| Module | Core Capability | Tech Powering It |
| :--- | :--- | :--- |
| [**Kairo AI Assistant**](#-1-kairo-ai--autonomous-executive-voice-companion) | Autonomous voice & chat companion, context reasoning, and tool execution | Groq LLaMA 3.3, Deepgram STT/TTS, FastAPI |
| [**Predictive ML & XAI**](#-2-predictive-ml-engine--explainable-ai-xai) | Procrastination risk, energy clustering, burnout detection & factor attribution | Scikit-Learn, XGBoost, KMeans, SHAP/XAI |
| [**Voice Brain Dump**](#-3-voice-brain-dump-pipeline) | Unstructured monologue transcription & multi-task automatic breakdown | Deepgram Nova-2, Groq LLM, Firestore |
| [**Smart Task Matrix**](#-4-multi-dimensional-task-matrix--daily-agenda) | Energy, difficulty, urgency mapping, Kanban, and dynamic Today view | Zustand, React 18, React Native |
| [**Vector Memory Vault**](#-5-semantic-vector-memory-vault) | Long-term contextual memory retrieval across conversations and notes | Supabase `pgvector`, Sentence Transformers |
| [**Zen Focus Room**](#-6-zen-focus-room--habit-momentum-os) | Pomodoro & flow timers, ambient audio soundscapes, and streak heatmaps | Web Audio API, Reanimated, Victory Native |
| [**Goal Hierarchy**](#-7-hierarchical-goals--milestone-alignment) | Long-term vision decomposed into linked weekly actionable deliverables | Firestore, AI Decomposition Engine |
| [**Smart Notifications**](#-8-smart-notifications--adaptive-snooze-engine) | Cross-device alerts with cognitive energy-aware intelligent snoozing | Web Push, Expo Notifications, Service Workers |
| [**Resilience & Offline**](#-9-enterprise-resilience--offline-first-architecture) | Circuit breakers, offline action queue, and auto-reconnecting WebSockets | Custom Circuit Breaker, IndexedDB, Axios |

---

### 🤖 1. Kairo AI — Autonomous Executive Voice Companion

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

### 🧠 2. Predictive ML Engine & Explainable AI (XAI)

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

### 🎙️ 3. Voice "Brain Dump" Pipeline

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

### ⚡ 4. Multi-Dimensional Task Matrix & Daily Agenda

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

### 🌌 5. Semantic Vector Memory Vault

Never lose a piece of context, preference, or past decision. Saarathi integrates a dedicated semantic memory engine.

* **Supabase `pgvector` Architecture**: High-dimensional vector indexing using dense Sentence Transformer embeddings (`all-MiniLM-L6-v2`).
* **Automated Knowledge Extraction**: Automatically harvests long-term user facts from chats, brain dumps, and completed milestones:
  * Work preferences (*"Prefers deep coding sessions in the early morning"*).
  * Recurring commitments (*"Has team standup every Tuesday at 10 AM"*).
  * Personal habits (*"Goes to the gym after 6 PM"*).
* **Instant Semantic Search**: Search your entire life history using natural language concepts rather than rigid keyword matches.
* **Assistant Context Injection**: Kairo seamlessly pulls relevant past memories into the conversation context window during planning sessions.

---

### ⏱️ 6. Zen Focus Room & Habit Momentum OS

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

### 🎯 7. Hierarchical Goals & Milestone Alignment

Connect your minute-to-minute tasks to your 5-year vision.

* **Tiered Goal Architecture**: Organize aspirations into **Vision** → **Objectives** → **Milestones** → **Actionable Tasks**.
* **Dynamic Progress Calculation**: Automatically recalculates milestone and goal completion percentages as linked daily tasks are checked off.
* **AI Goal Decomposition**: Ask Kairo to break down ambitious goals (e.g., *"Prepare for AWS Solutions Architect Certification"*) into weekly actionable sprints.

---

### 🔔 8. Smart Notifications & Adaptive Snooze Engine

Notifications that respect your focus rather than fragmenting your attention.

* **Cross-Platform Delivery**: Synchronized notifications across Web Push and Mobile Native (iOS / Android Expo push tokens).
* **Cognitive Energy-Aware Snoozing**:
  * ☀️ **Snooze to Next High-Energy Window**: Re-alerts you when your cognitive curve indicates optimal focus.
  * 🌅 **Snooze to Tomorrow Morning**: Postpones non-essential alerts to the start of the next workday.
  * ⏱️ **Quick Snooze**: Standard +15m, +1h, or +3h options.
* **Quiet Hours & Fatigue Safeguards**: Intelligent throttling prevents notification spam during active focus sessions and late-night hours.

---

### 🛡️ 9. Enterprise Resilience & Offline-First Architecture

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

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT ECOSYSTEM                                     │
│     📱 React Native (Expo / iOS / Android)        💻 Vite + React.js Web Dashboard     │
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

## 🛠️ Tech Stack

| Domain | Technologies | Purpose |
| :--- | :--- | :--- |
| **Mobile Client** | React Native, Expo, Expo Router, Reanimated | Cross-platform native mobile experience (iOS/Android) |
| **Web Client** | React 18, Vite, Tailwind CSS, Lucide Icons | High-performance desktop and browser workstation |
| **State & API** | Zustand, TypeScript, Axios, WebSocket | Reactive state management & synchronized offline store |
| **Backend Gateway** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 | High-throughput asynchronous REST & WebSocket microservices |
| **AI & LLM** | Groq API (`llama-3.3-70b-versatile`), Deepgram Nova-2 | High-speed inference, conversational reasoning, and voice I/O |
| **Machine Learning** | XGBoost, Scikit-Learn, Pandas, NumPy, SHAP | Procrastination risk prediction & behavioral telemetry clustering |
| **Vector Search** | Supabase (`pgvector`), Sentence-Transformers | Semantic memory vault & dense context similarity matching |
| **Data & Auth** | Google Firebase Authentication, Cloud Firestore | Realtime operational documents and identity management |

---

## 📂 Monorepo Structure

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

## 🚀 Getting Started

### 📋 Prerequisites

Ensure the following tools are installed on your machine:
* **Node.js**: `v18.x` or higher
* **Python**: `v3.10` or higher
* **npm** / **yarn** / **pnpm**
* **Git**

---

### 📥 1. Clone the Repository

```bash
git clone https://github.com/siddharthg-7/Saarathi.git
cd Saarathi
```

---

### 📦 2. Install Monorepo Dependencies

```bash
# Install root, workspace packages, web, and mobile dependencies
npm install
```

---

### ⚙️ 3. Environment Configuration

Create `.env` files in each sub-application using the corresponding templates:

#### Backend (`backend/.env`):
```env
ENVIRONMENT=development
PORT=8000
GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

#### Web Dashboard (`apps/web/.env`):
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

#### Mobile App (`apps/mobile/.env`):
```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
```

---

### 💻 4. Run Development Servers

Open separate terminal tabs or run them concurrently:

#### Start Python AI Backend Gateway:
```bash
cd backend
python -m venv .venv
# Activate: source .venv/bin/activate (Linux/Mac) or .venv\Scripts\activate (Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Start Web Application:
```bash
cd apps/web
npm run dev
# Web app running at http://localhost:5173
```

#### Start Mobile App (Expo):
```bash
cd apps/mobile
npx expo start
# Scan QR code using Expo Go app on iOS or Android
```

---

## 🧪 Testing & Validation

Execute test suites across the ecosystem to verify resilience and model stability:

```bash
# Run backend pytest suite with resilience assertions
cd backend
pytest -v

# Run workspace TypeScript lint and check
npm run lint
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](file:///c:/project-self-1/Saarathi/LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ for peak human focus and autonomous productivity.</sub>
</div>
