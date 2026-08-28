# Saarathi Performance Baseline & Measurements

**Date:** 2026-08-28  
**Phase:** Phase 13 — Performance Optimization  
**Platform:** Saarathi OS (Web, Mobile, Backend Gateway)  

---

## 1. Web Frontend Baseline (Pre-Optimization)

### A. Production Build & Bundle Metrics
- **Total JavaScript Bundle Size:** `1,595.59 kB` (Single monolithic `index-[hash].js` bundle)
- **Gzipped JavaScript Size:** `412.63 kB`
- **CSS Bundle Size:** `125.33 kB` (gzip: `19.34 kB`)
- **Number of JS Chunks:** 1 monolithic chunk
- **Vite Warning:** `(!) Some chunks are larger than 500 kB after minification.`

### B. View Loading & Code Organization
- All 14 views (`DashboardView`, `TodayView`, `CalendarView`, `TaskBoardView`, `AIChatView`, `AnalyticsView`, `BrainDumpView`, `FocusModeView`, `HabitsEngineView`, `GoalsSystemView`, `SettingsView`, `NotificationsProfileView`, `AuthView`, `LandingPage`) are statically imported at root in `App.tsx`.
- **Target:** Split vendor libraries into separate chunks (`vendor-firebase`, `vendor-motion`, `vendor-icons`, `vendor-ui`) and dynamically import secondary views (`React.lazy`) so the initial dashboard chunk is < 250 kB.

---

## 2. Database & Firestore Query Baseline

### A. Task & Notification Query Patterns
- `subscribeToTasks`: Queries `collection(db, 'users', uid, 'tasks')` with `orderBy('orderIndex', 'asc')` without limit or status filters. Unbounded on growing task histories.
- `subscribeToNotifications`: Queries `collection(db, 'users', userId, 'notifications')` with `orderBy('timestamp', 'desc')` without `limit()`.
- **Target:**
  - Add `limit(50)` to live notification listener.
  - Implement cursor-based pagination (`limit`, `startAfter`) for historical queries.
  - Add composite compound indexes in `firestore.indexes.json`.

---

## 3. Backend Gateway & AI Latency Baseline

### A. API Latencies (Measured on localhost dev runtime)
- **Health Check (`GET /v1/health`):** `< 5 ms`
- **ML Task Risk Prediction (`POST /v1/ml/predict-risk`):** `15–30 ms`
- **Memory Hybrid Search (`POST /v1/memory/search`):** `40–90 ms` (with embedding vectorization)
- **Kairo Chat WebSocket Token-To-First-Token:** Fast initial response stream via Groq.
- **Target:** Cap prompt orchestration context size (`MAX_MEMORY_TOKENS = 600`, max 10 tasks, max 5 goals) and add request deduplication to prevent re-processing identical queries.

---

## 4. Mobile & Offline Baseline
- **Storage Strategy:** Secure credentials in Expo SecureStore / Keychain; task state in Zustand store with offline Firestore persistence.
- **Target:** Avoid continuous polling by relying on event-driven listeners and selective Zustand subscriptions.
