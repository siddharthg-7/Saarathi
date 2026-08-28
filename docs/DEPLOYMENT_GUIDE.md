# Saarathi OS — Production Deployment & DevOps Architecture Guide
**Phase 16 — Production Release & Cross-Platform Orchestration**

---

## 1. System Deployment Topology

```
                         SAARATHI ECOSYSTEM
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
          WEB APPLICATION                MOBILE APPLICATION
       React 19 / Vite SPA               Expo / React Native
       Deployed on: VERCEL               Built via: EXPO EAS (APK / Bundle)
                 │                               │
                 └───────────────┬───────────────┘
                                 │ HTTPS / WSS
                                 ▼
                     FASTAPI GATEWAY BACKEND
                     Deployed on: RENDER (Web Service)
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
          CELERY WORKER                  REDIS KEY-VALUE
     Render Background Worker          Render Managed Redis
    (Brain Dump & Batch Tasks)       (Job Queue & Fast Cache)
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                    EXTERNAL CLOUD SERVICES
   ┌─────────────────────────────┼─────────────────────────────┐
   ▼                             ▼                             ▼
FIREBASE                      SUPABASE                     AI INFERENCE
Auth & Firestore           PGVector Memory             Gemini / Groq / Deepgram
```

---

## 2. Automated Work Completed by Antigravity

The codebase is pre-configured and automated for zero-friction cloud deployment:

| File / Component | Purpose | Status |
| :--- | :--- | :--- |
| [`render.yaml`](file:///c:/project-self-1/Saarathi/render.yaml) | Render Infrastructure-as-Code Blueprint (FastAPI + Celery + Redis) | ✅ Configured |
| [`apps/web/vercel.json`](file:///c:/project-self-1/Saarathi/apps/web/vercel.json) | Vercel SPA routing rewrites, immutable asset caching, & security headers | ✅ Configured |
| [`apps/mobile/eas.json`](file:///c:/project-self-1/Saarathi/apps/mobile/eas.json) | Expo EAS build profiles for Android APK preview & production bundles | ✅ Configured |
| [`firestore.rules`](file:///c:/project-self-1/Saarathi/firestore.rules) | Production Firestore user boundary isolation & security rules | ✅ Secured |
| [`storage.rules`](file:///c:/project-self-1/Saarathi/storage.rules) | Production Firebase Storage MIME type & size restrictions | ✅ Secured |
| [`backend/app/worker.py`](file:///c:/project-self-1/Saarathi/backend/app/worker.py) | Celery task runner for async voice brain dumps and telemetry rollups | ✅ Created |
| [`Dockerfile`](file:///c:/project-self-1/Saarathi/Dockerfile) | Multi-stage production container build with non-root security user | ✅ Verified |
| [`docker-compose.yml`](file:///c:/project-self-1/Saarathi/docker-compose.yml) | Local & staging multi-service orchestration | ✅ Verified |
| [`.github/workflows/ci.yml`](file:///c:/project-self-1/Saarathi/.github/workflows/ci.yml) | GitHub Actions CI for lint, typecheck, pytest, vitest, and Docker | ✅ Automated |
| [`Jenkinsfile`](file:///c:/project-self-1/Saarathi/Jenkinsfile) | Monorepo CI/CD pipeline definition | ✅ Automated |
| [`.gitignore`](file:///c:/project-self-1/Saarathi/.gitignore) | Complete secret prevention and credential exclusion rules | ✅ Verified |

---

## 3. Manual Steps: What YOU Need to Do

Follow these sequential steps in your cloud service dashboards:

---

### Step 1: Firebase Production Setup & Rule Deployment

1. Open [Firebase Console](https://console.firebase.google.com/) and select your **Saarathi** project.
2. **Authentication**:
   - Ensure **Email/Password** provider is enabled in `Authentication` > `Sign-in method`.
   - (Optional) Enable **Google Sign-In** if credentials are configured.
3. **Deploy Firestore Security Rules**:
   - In Firebase Console, navigate to `Firestore Database` > `Rules`.
   - Copy the contents of [`firestore.rules`](file:///c:/project-self-1/Saarathi/firestore.rules) and paste into the editor.
   - Click **Publish**.
4. **Deploy Storage Security Rules**:
   - In Firebase Console, navigate to `Storage` > `Rules`.
   - Copy the contents of [`storage.rules`](file:///c:/project-self-1/Saarathi/storage.rules) and paste into the editor.
   - Click **Publish**.
5. **Get Firebase Web App Config**:
   - Go to `Project settings` (gear icon) > `General` > `Your apps`.
   - Under **Web apps**, note down your config keys for Step 4.

---

### Step 2: Supabase PGVector Memory Setup

1. Open [Supabase Dashboard](https://app.supabase.com/) and select or create your project.
2. Under `Project Settings` > `API`:
   - Copy your **Project URL** (`SUPABASE_URL`).
   - Copy your **service_role key** (secret key used by FastAPI backend for vector storage).
3. Under `SQL Editor`, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

---

### Step 3: Deploy Backend on Render (FastAPI + Celery + Redis)

1. Sign in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository (`siddharthg-7/Saarathi`).
4. Render will automatically detect [`render.yaml`](file:///c:/project-self-1/Saarathi/render.yaml) and prompt you to create:
   - **`saarathi-api`** (FastAPI Web Service)
   - **`saarathi-worker`** (Celery Background Worker)
   - **`saarathi-redis`** (Managed Redis Key-Value instance)
5. Fill in the required environment secrets in the Render dashboard:

| Variable Name | Recommended Value / Source |
| :--- | :--- |
| `ENVIRONMENT` | `production` |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID (e.g. `saarathi-331b4`) |
| `FIREBASE_CREDENTIALS_JSON` | Minified Firebase Service Account JSON |
| `GROQ_API_KEY` | `gsk_...` from [Groq Console](https://console.groq.com/) |
| `GEMINI_API_KEY` | `AIzaSy...` from [Google AI Studio](https://aistudio.google.com/) |
| `DEEPGRAM_API_KEY` | API Key from [Deepgram Console](https://console.deepgram.com/) |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role secret |
| `CORS_ALLOWED_ORIGINS` | `https://your-saarathi-app.vercel.app` |

6. Click **Apply**. Once deployed, verify by opening:
   ```
   https://your-api.onrender.com/v1/health
   ```
   Expected response: `{"status":"ok","service":"Saarathi FastAPI","version":"1.0.0"}`

---

### Step 4: Deploy Web Application on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import your GitHub repository (`Saarathi`).
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the following **Environment Variables** in Vercel:

| Variable Name | Source |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web Client API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `<project>.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |
| `VITE_API_URL` | `https://your-api.onrender.com` (from Step 3) |

5. Click **Deploy**. Vercel will build and assign your production URL (e.g., `https://saarathi-os.vercel.app`).
6. Update `CORS_ALLOWED_ORIGINS` on Render (Step 3) with this new Vercel domain.

---

### Step 5: Mobile App Build with Expo EAS (Standalone Android APK)

1. Open your terminal and install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log in with your Expo account:
   ```bash
   eas login
   ```
3. Navigate into `apps/mobile`:
   ```bash
   cd apps/mobile
   ```
4. Build the standalone Android APK for immediate device testing (bypassing Google Play fees):
   ```bash
   eas build --platform android --profile preview
   ```
5. When the cloud build finishes, download the `.apk` file directly to your Android device to install and test.

---

### Step 6: Sentry Error Monitoring Setup

1. Create a free account at [Sentry.io](https://sentry.io/).
2. Create two projects:
   - `saarathi-web` (React / JavaScript)
   - `saarathi-backend` (Python / FastAPI)
3. Note down the **DSN** strings to receive real-time production error alerts and trace stacktraces.

---

### Step 7: CI/CD Pipeline Execution

1. Push your commit to the `main` branch:
   ```bash
   git push origin main
   ```
2. GitHub Actions will automatically run the [CI workflow](file:///c:/project-self-1/Saarathi/.github/workflows/ci.yml), verifying:
   - Workspace TypeScript types (`npm run lint:types`)
   - 116 frontend unit & store tests (`vitest run`)
   - Backend Python security & unit tests (`pytest`)
   - Containerization (`docker build`)

---

## 4. Cross-Platform Production Verification Checklist

Run through this test matrix once your web and mobile APK deployments are live:

- [ ] **Authentication**: Login on Web and Mobile with the same account.
- [ ] **Task Creation**: Create task on Web → Verify instant Firestore appearance on Mobile.
- [ ] **Task Sync**: Create task on Mobile → Verify instant appearance on Web.
- [ ] **Offline Resilience**: Turn off WiFi on Mobile, complete task, reconnect → Verify sync state resolves without data loss.
- [ ] **Smart Reminders**: Schedule reminder on Web → Confirm push alert triggers on Mobile.
- [ ] **Voice Brain Dump**: Record voice dump on Mobile → Confirm tasks appear in Web task board.
- [ ] **Kairo AI Chat**: Send prompt in Web chat → Verify session context availability.
- [ ] **Long-Term Memory**: Save memory preference → Confirm semantic retrieval works.
- [ ] **Analytics Heatmap**: Log mood/energy check-in → Confirm 7x24 heatmap update.
- [ ] **Logout**: Click **Sign Out** on Web / Mobile → Confirm complete state purge and redirect to public landing page.
