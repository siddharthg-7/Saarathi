# Folder Structure: Saarathi & Kairo Monorepo

This production-grade folder structure is designed for a monorepo containing your **React Native (Expo)** mobile app, **Vite + React (Web)** dashboard, shared business logic, and **FastAPI** Python backend.

It implements the single code philosophy where core logic, state management, and API clients are shared across platforms.

---

## Complete Monorepo Directory Tree

```text
saarathi/
│
├── apps/
│   ├── mobile/                          # React Native (Expo) Mobile App
│   │   ├── app/                         # Expo Router file-based routing
│   │   │   ├── (auth)/                  # Authentication screens (Login / Register modals)
│   │   │   ├── (tabs)/                  # Main bottom-nav tabs (Home, Tasks, Brain Dump, Analytics)
│   │   │   ├── focus/                   # Focus Mode / Pomodoro screen
│   │   │   └── _layout.tsx              # Root mobile layout & providers
│   │   ├── assets/                      # Images, fonts, and icons
│   │   ├── app.json                     # Expo configuration
│   │   ├── babel.config.js
│   │   ├── package.json
│   │   └── tailwind.config.js           # NativeWind configuration
│   │
│   └── web/                             # Vite + React.js Web Dashboard
│       ├── src/
│       │   ├── components/              # Web-specific UI components (Modals, Command Palette)
│       │   ├── pages/                   # Dashboard views (Home, Tasks, Vault, Settings)
│       │   ├── App.tsx                  # Root web router and layout
│       │   ├── main.tsx                 # React DOM mount point
│       │   └── index.css                # Tailwind CSS imports & global styles
│       ├── index.html                   # HTML entry point with title & metadata
│       ├── package.json
│       ├── tailwind.config.js           # Tailwind CSS web configuration
│       └── vite.config.ts               # Vite bundler configuration
│
├── backend/                             # FastAPI Python AI & ML Backend
│   ├── app/
│   │   ├── api/                         # API Routers (FastAPI Endpoints)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                  # Token verification & user sync
│   │   │   ├── brain_dump.py            # Deepgram STT & Groq task extraction
│   │   │   ├── kairo.py                 # Kairo chat and daily briefing logic
│   │   │   ├── ml.py                    # XGBoost / Random Forest / KMeans inference
│   │   │   └── memory.py                # Supabase PGVector semantic search
│   │   ├── core/                        # Configuration & Security
│   │   │   ├── config.py                # Environment variables & settings
│   │   │   └── security.py              # Firebase Admin SDK initialization
│   │   ├── ml_models/                   # Machine Learning Artifacts & Training
│   │   │   ├── artifacts/               # Saved .pkl model files (XGBoost, KMeans)
│   │   │   ├── training/                # Training scripts (scikit-learn / pandas)
│   │   │   └── features.py              # Feature engineering pipeline
│   │   ├── services/                    # Business logic & External integrations
│   │   │   ├── deepgram_service.py      # Speech-to-text / Text-to-speech handler
│   │   │   ├── groq_service.py          # Llama 3.3 LLM orchestration
│   │   │   └── vector_service.py        # Sentence transformers & PGVector client
│   │   ├── models.py                    # Pydantic data validation schemas
│   │   └── main.py                      # FastAPI application entry point
│   ├── Dockerfile                       # Container definition for deployment
│   ├── requirements.txt                 # Python dependencies (FastAPI, uvicorn, scikit-learn, etc.)
│   └── celery_worker.py                 # Background cron jobs & telemetry aggregators
│
├── packages/                            # Shared Logic & Types (70-80% Code Sharing)
│   ├── api/                             # Shared API Client (Axios / Fetch wrappers)
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── store/                           # Zustand Global State Management
│   │   ├── useAuthStore.ts
│   │   ├── useTaskStore.ts
│   │   └── useKairoStore.ts
│   ├── types/                           # TypeScript Interfaces & Data Models
│   │   ├── task.ts
│   │   ├── user.ts
│   │   └── analytics.ts
│   └── utils/                           # Helper functions (Date formatters, calculations)
│       ├── formatters.ts
│       └── constants.ts
│
├── .gitignore                           # Git ignore rules (node_modules, .env, .pkl)
├── package.json                         # Monorepo root package manager (pnpm / npm workspaces)
└── README.md                            # Project documentation & setup guide

```

---

## Key Structural Highlights

* **`apps/mobile/` & `apps/web/` Separation:** Keeps platform-specific UI code clean. Mobile uses React Native primitives with NativeWind; Web uses standard HTML/React elements with Tailwind CSS.
* **`packages/` Monorepo Architecture:** Centralizes state (`Zustand`), types (`TypeScript`), and API clients so both mobile and web apps pull from the exact same business logic layer.
* **`backend/app/ml_models/`:** Houses your trained Scikit-Learn/XGBoost `.pkl` artifacts and training scripts separately from core routing, ensuring clean separation of concerns for the machine learning pipeline.