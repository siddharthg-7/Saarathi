# Environment Variable Strategy: Saarathi & Kairo

This environment variable strategy defines how configuration secrets, API keys, and runtime variables are securely managed, isolated, and loaded across the **Saarathi** monorepo—spanning the **Mobile App (Expo)**, **Web Dashboard (Vite React)**, and **FastAPI Backend**.

---

## 1. Security Principles & Best Practices

* **Zero Secrets on Client:** Never store private API keys (Groq, Deepgram, Supabase Service Role, Firebase Admin SDK) in frontend applications (Expo or Vite). Frontend apps only handle public client keys (Firebase Web/Mobile API keys).
* **Environment Isolation:** Use distinct `.env` files for local development (`.env.local`), staging, and production.
* **Git Exclusions:** Ensure all `.env*` files (except `.env.example` templates) are explicitly added to `.gitignore` to prevent leaking credentials into version control.

---

## 2. Environment Variable Configuration Matrix

| Variable Name | Scope / Target | Description | Example Value |
| --- | --- | --- | --- |
| **`EXPO_PUBLIC_FIREBASE_API_KEY`** | Mobile (`apps/mobile`) | Firebase Public Web/Mobile API Key | `AIzaSyB...` |
| **`EXPO_PUBLIC_FIREBASE_PROJECT_ID`** | Mobile (`apps/mobile`) | Firebase Project Identifier | `saarathi-os` |
| **`EXPO_PUBLIC_API_BASE_URL`** | Mobile (`apps/mobile`) | FastAPI Backend Base URL | `[https://api.saarathi.os/v1](https://api.saarathi.os/v1)` |
| **`VITE_FIREBASE_API_KEY`** | Web (`apps/web`) | Firebase Public API Key for Web | `AIzaSyB...` |
| **`VITE_FIREBASE_PROJECT_ID`** | Web (`apps/web`) | Firebase Project Identifier | `saarathi-os` |
| **`VITE_API_BASE_URL`** | Web (`apps/web`) | FastAPI Backend Base URL | `[https://api.saarathi.os/v1](https://api.saarathi.os/v1)` |
| **`GROQ_API_KEY`** | Backend (`backend/`) | Secret API key for Groq Llama 3.3 orchestration | `gsk_...` |
| **`GEMINI_API_KEY`** | Backend (`backend/`) | Secret API key for rate-limited Gemini model planning | `AIzaSyB...` |
| **`DEEPGRAM_API_KEY`** | Backend (`backend/`) | Secret API key for STT / TTS voice pipelines | `dg_...` |
| **`SUPABASE_URL`** | Backend (`backend/`) | Supabase PGVector database instance URL | `[https://xyz.supabase.co](https://xyz.supabase.co)` |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Backend (`backend/`) | Supabase Secret Service Role Key for vector writes | `eyJhbG...` |
| **`FIREBASE_SERVICE_ACCOUNT_JSON`** | Backend (`backend/`) | Path or JSON string for Firebase Admin SDK auth | `/secrets/firebase-admin.json` |

---

## 3. Implementation Guidelines by Tier

### A. Mobile App (`apps/mobile/.env`)

Expo uses the `EXPO_PUBLIC_` prefix to securely bundle public environment variables into the mobile app binary at build time.

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=saarathi-os.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=saarathi-os
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/v1

```

### B. Web App (`apps/web/.env`)

Vite requires the `VITE_` prefix to expose public environment variables to client-side code via `import.meta.env`.

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=saarathi-os.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=saarathi-os
VITE_API_BASE_URL=http://localhost:8000/v1

```

### C. FastAPI Backend (`backend/.env`)

The Python backend uses `pydantic-settings` to load secret environment variables securely on startup. Create a `backend/.env` file referencing your keys:

```env
# Server Configuration
PORT=8000
ENVIRONMENT=development

# AI & Voice Providers
GROQ_API_KEY=gsk_secret_groq_key_here
GEMINI_API_KEY=your_gemini_key_here
DEEPGRAM_API_KEY=dg_secret_deepgram_key_here

# Vector Database (Supabase PGVector)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Firebase Admin SDK
FIREBASE_CREDENTIALS_PATH=app/core/firebase-service-account.json

```

---

## 4. Pydantic Validation on Backend Startup (`backend/app/core/config.py`)

To prevent the backend from starting with missing or misconfigured credentials, validate environment variables on boot using Pydantic:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GROQ_API_KEY: str
    DEEPGRAM_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

```