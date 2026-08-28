# Saarathi Performance Architecture & Optimization Guide

**Version:** 1.0.0  
**Phase:** Phase 13 — Performance Optimization  
**Platform:** Saarathi OS (Web, Mobile, Backend Gateway)  
**Cost Model:** Free-First / Zero External Infrastructure Cost  

---

## 1. Architectural Overview

Saarathi enforces high responsiveness, sub-second interactions, minimal memory footprints, and instant offline-first transitions without introducing paid CDNs or third-party enterprise services.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│                                                             │
│  ┌──────────────────────┐       ┌────────────────────────┐  │
│  │   Vite Rollup Lazy   │       │   Zustand Selective    │  │
│  │   Route Chunks (<240kB)      │   Store Subscriptions  │  │
│  └──────────┬───────────┘       └───────────┬────────────┘  │
│             │                               │               │
│             ▼                               ▼               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  In-Flight Request Deduplication & Offline Cache      │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Gateway                        │
│                                                             │
│  ┌──────────────────────┐       ┌────────────────────────┐  │
│  │ Bounded Query Limits │       │ Clamped AI Contexts    │  │
│  │ (limit=50, cursor)   │       │ (Max 10 tasks/5 goals) │  │
│  └──────────┬───────────┘       └───────────┬────────────┘  │
└─────────────┼───────────────────────────────┼───────────────┘
              │                               │
              ▼                               ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│  Firestore Composite      │   │  Groq Fast AI Streaming     │
│  Indexes (indexes.json)   │   │  (Sub-second TTFT)          │
└───────────────────────────┘   └─────────────────────────────┘
```

---

## 2. Frontend Code Splitting & Lazy-Loading Strategy

### A. Vendor Chunk Separation
Vendor packages are partitioned into discrete, browser-cached Rollup bundles in `apps/web/vite.config.ts`:
- `vendor-firebase-firestore` (~420 kB): Firestore data engine.
- `vendor-firebase-auth` (~127 kB): Auth SDK and token manager.
- `vendor-firebase-core` (~93 kB): Firebase base initialization.
- `vendor-react-core` (~192 kB): React, ReactDOM, Zustand state store.
- `vendor-lucide` (~32 kB): UI icon set.
- `vendor-motion` (~28 kB): Animation primitives.
- `vendor-ui` (~33 kB): Toastify, Date-Fns, Confetti.

### B. Route-Based Lazy Loading
Critical path views (`LandingPage`, `AuthView`, `DashboardView`, `TodayView`) load eagerly in the main bundle (`index.js` = **239 kB**). Secondary views are split into on-demand asynchronous modules via `React.lazy()` and rendered within `<Suspense fallback={<ViewLoadingFallback />}>`:
- `HabitsEngineView`: 4.95 kB
- `CalendarView`: 5.89 kB
- `GoalsSystemView`: 6.46 kB
- `TaskBoardView`: 7.43 kB
- `FocusModeView`: 7.67 kB
- `BrainDumpView`: 8.83 kB
- `AIChatView`: 10.53 kB
- `NotificationsProfileView`: 23.04 kB
- `SettingsView`: 26.59 kB
- `AnalyticsView`: 37.16 kB

---

## 3. Database Query & Firestore Optimization

### A. Composite Compound Indexing
Configured in [`firestore.indexes.json`](file:///c:/project-self-1/Saarathi/firestore.indexes.json):
1. `tasks`: `status` (ASC) + `deadline` (ASC)
2. `tasks`: `scheduledDate` (ASC) + `priority` (DESC)
3. `tasks`: `category` (ASC) + `createdAt` (DESC)
4. `notifications`: `read` (ASC) + `timestamp` (DESC)
5. `telemetry`: `eventType` (ASC) + `timestamp` (DESC)
6. `audit_logs`: `action` (ASC) + `timestamp` (DESC)

### B. Cursor-Based Pagination
All unbounded endpoints and services (`fetchTasksPaginated`, `fetchNotificationsPaginated`, `get_user_tasks_paginated`, `get_user_telemetry_paginated`) implement cursor progression:
```typescript
{
  items: T[],
  nextCursor: string | null,
  hasMore: boolean,
  count: number
}
```
- Real-time listeners apply default safety caps (`limit(50)` for notifications, `limit(200)` for live tasks).

---

## 4. AI & Inference Optimization

### A. Context Bounding
In [`backend/app/services/prompt_orchestration.py`](file:///c:/project-self-1/Saarathi/backend/app/services/prompt_orchestration.py):
- Active tasks are filtered down to top-10 non-completed items.
- Active goals are filtered down to top-5 ongoing goals.
- Retrieved long-term memory context is clamped to 2,500 characters to prevent prompt inflation.

### B. In-Flight Request Deduplication
In [`packages/api/src/kairoApi.ts`](file:///c:/project-self-1/Saarathi/packages/api/src/kairoApi.ts):
- Concurrent duplicate calls to `sendMessage`, `getDailyBriefing`, or `decomposeGoal` share an active in-flight promise, preventing duplicate token burns and redundant network traffic.

---

## 5. Memory & Lifecycle Management

- **Event Listeners & Subscriptions:** All Firestore `onSnapshot` listeners returned by store initializers (`initTaskListener`, `initGoalListener`, `initNotificationListener`, `initAnalyticsListener`) are explicitly cleaned up in `useEffect` unmount hooks.
- **Zustand State:** Stores maintain isolated slices to avoid full-tree component re-renders.
- **Audio Resources:** Audio recording and playback buffers in the Brain Dump pipeline release hardware handles immediately upon stream completion.
