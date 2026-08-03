<div align="center">

# Saarathi & Kairo
### Personal Productivity Operating System

<img src="https://api.iconify.design/lucide:cpu.svg?color=%236366F1&width=48&height=48" alt="Saarathi Logo" />

<p align="center">
  An AI-powered productivity ecosystem that learns from user behavior, predicts procrastination, intelligently schedules work, and guides long-term goals.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active_Development-6366F1?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/Platform-Cross_Platform-10B981?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/License-MIT-3B82F6?style=flat-square" alt="License" />
</p>

</div>

---

## Architecture Overview

Saarathi combines high-performance mobile and web clients with an asynchronous Python backend, integrating LLM orchestration, classical machine learning models, voice pipelines, and vector memory search.


```

┌─────────────────────────────────────────────────────────┐
│                    Client Ecosystem                     │
│    React Native (Expo)          Vite + React.js (Web)   │
└────────────────────────────┬────────────────────────────┘
│
Firebase Auth & Firestore Real-Time Sync
│
▼
[FastAPI Python Backend Gateway]
│
┌──────────────────────┼──────────────────────┐
│                      │                      │
[Deepgram STT/TTS]    [Groq Llama 3.3]     [XGBoost / Scikit-Learn]
(Voice Pipeline)     (AI Orchestration)    (Behavioral ML Models)
│                      │                      │
└──────────────────────┼──────────────────────┘
│
[Data & Memory]
┌──────────────┴──────────────┐
│                             │
[Firestore DB]              [Supabase PGVector]
(Operational Data)            (Long-Term Memory)

```

---

## Core Modules

| Module | Description | Technologies |
| :--- | :--- | :--- |
| **Smart Task Management** | Granular multi-dimensional task attributes including energy, difficulty, urgency, and AI summaries. | Firestore, Zustand, TypeScript |
| **Kairo AI Assistant** | Conversational planner and productivity coach maintaining full context of schedules and habits. | Groq, Llama 3.3, FastAPI |
| **Brain Dump Pipeline** | Voice-to-task engine transforming unstructured audio recordings into structured, prioritized lists. | Deepgram STT, Groq |
| **Predictive ML Engine** | Behavioral telemetry models calculating completion, delay, and skip probabilities alongside energy clustering. | XGBoost, Scikit-Learn, KMeans |
| **Vector Memory Vault** | Semantic search allowing users to retrieve past notes, ideas, and chats instantly. | Supabase PGVector, Sentence Transformers |
| **Focus Mode & Habits** | Minimalist distraction-free Pomodoro workspace paired with consistency tracking and streak analytics. | React Native Reanimated, Victory Native |

---

## Tech Stack

### Mobile & Web Clients
* <img src="https://api.iconify.design/lucide:smartphone.svg?color=%236366F1&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **React Native (Expo & Expo Router)** — Cross-platform mobile application
* <img src="https://api.iconify.design/lucide:monitor.svg?color=%233B82F6&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Vite + React.js** — High-performance desktop web dashboard
* <img src="https://api.iconify.design/lucide:palette.svg?color=%2310B981&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **NativeWind / Tailwind CSS** — Minimalist glassmorphism styling

### Backend & Intelligence
* <img src="https://api.iconify.design/lucide:server.svg?color=%23F59E0B&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **FastAPI & Python** — Asynchronous backend gateway
* <img src="https://api.iconify.design/lucide:brain.svg?color=%23EF4444&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Groq API & Llama 3.3** — Natural language understanding and reasoning
* <img src="https://api.iconify.design/lucide:mic.svg?color=%238B5CF6&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Deepgram API** — Speech-to-text and text-to-speech processing
* <img src="https://api.iconify.design/lucide:database.svg?color=%2306B6D4&width=16&height=16" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" /> **Supabase PGVector** — Dense vector embeddings and semantic search

---

## Monorepo Structure

```text
saarathi/
├── apps/
│   ├── mobile/         # React Native (Expo) mobile application
│   └── web/            # Vite + React.js web dashboard
├── backend/            # FastAPI Python AI, ML, and vector memory service
├── packages/           # Shared state (Zustand), API clients, and TypeScript types
└── README.md

```

---

## Getting Started

### Prerequisites

* Node.js (v18+)
* Python (v3.10+)
* Firebase CLI & Supabase Account

### Installation

1. Clone the repository:
```bash
git clone [https://github.com/your-username/saarathi.git](https://github.com/your-username/saarathi.git)
cd saarathi

```


2. Install monorepo dependencies:
```bash
npm install

```


3. Configure environment variables in `apps/mobile/.env`, `apps/web/.env`, and `backend/.env` following the provided templates.
4. Start development servers:
* **Backend:** `cd backend && uvicorn app.main:app --reload`
* **Web Dashboard:** `cd apps/web && npm run dev`
* **Mobile App:** `cd apps/mobile && npx expo start`



---

## License

Distributed under the MIT License. See `LICENSE` for more information.

```

```