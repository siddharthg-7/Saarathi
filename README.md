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

## ✨ Key Features & Capabilities

### 🤖 Kairo Conversational AI Companion
* **Proactive Executive Assistant**: High context retention across tasks, past dialogues, calendar slots, and user habits.
* **Direct Action Execution**: Converts conversational intents into scheduled tasks, updated priorities, and timer triggers without friction.
* **Low-Latency Voice Interaction**: Ultra-responsive speech pipeline powered by Deepgram Nova-2 STT/TTS and Groq Llama 3.3.

### 🧠 Predictive ML & Behavioral Telemetry
* **Procrastination & Risk Prediction**: Trained machine learning classifiers (XGBoost / Scikit-Learn) estimating task completion likelihood, delay probability, and skip risk.
* **Cognitive Energy Dynamic Clustering**: Analyzes time-of-day completion velocities to identify optimal focus windows.
* **Explainable AI (XAI)**: Actionable feedback showing why specific tasks are flagged with elevated delay probabilities.

### 🎙️ Voice "Brain Dump" Engine
* **Instant Stream-of-Consciousness Parsing**: Speak freely about everything on your mind; Saarathi transcribes and extracts distinct actionable items.
* **Intelligent Attribute Extraction**: Automatically infers urgency, cognitive difficulty, estimated duration, and tags from speech recordings.

### 🌌 Long-Term Vector Memory Vault
* **Semantic Retrieval**: Powered by Supabase `pgvector` and dense Sentence Transformer embeddings.
* **Contextual Recall**: Enables Kairo and the user to instantly recall historical notes, previous decision logs, and contextual knowledge.

### ⏱️ Zen Focus Workspace & Habit Tracker
* **Distraction-Free Focus Room**: Minimalist Pomodoro timer with ambient sounds and real-time state synchronization.
* **Streak & Consistency Analytics**: Visual velocity heatmaps and habit consistency tracking.

### 🛡️ Enterprise Resilience Architecture
* **Circuit Breakers & Health Monitors**: Automated fallback mechanisms protecting against backend degradation.
* **Resilient WebSocket Channels**: Automatic exponential backoff reconnection and offline state queues.

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
