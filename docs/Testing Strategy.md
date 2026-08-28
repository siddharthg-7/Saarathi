# Saarathi Quality Engineering & Testing Strategy

**Version:** 1.0.0  
**Phase:** Phase 15 — Testing & Quality Assurance  
**Platform:** Saarathi OS (Web, Mobile, Backend Gateway)  

---

## 1. Test Pyramid & Architectural Philosophy

Saarathi enforces a multi-tier testing pyramid ensuring correctness, data consistency, security, and low latency across the entire stack without relying on brittle end-to-end tests for low-level logic.

```
                  ┌──────────────────────┐
                  │    E2E Journeys      │  (Playwright / Detox)
                  │ Critical Workflows   │
                  └──────────┬───────────┘
                             │
                  ┌──────────┴───────────┐
                  │  Integration Tests   │  (FastAPI endpoints,
                  │  & Boundary Checks   │   Firestore emulator,
                  └──────────┬───────────┘   Offline Sync)
                             │
         ┌───────────────────┴───────────────────┐
         │         Unit & Store Logic            │  (Vitest, Pytest,
         │ Pure Functions, ML Metrics, AI Prompts│   Zustand Slices)
         └───────────────────────────────────────┘
```

---

## 2. Test Frameworks & Tooling

| Domain | Framework | Runners & Utilities | Test Target / Scope |
| :--- | :--- | :--- | :--- |
| **Web Frontend** | `Vitest` / `Testing Library` | `@testing-library/react`, `happy-dom` | Zustand stores, React views, UI interaction, optimistic rollbacks |
| **Backend API** | `Pytest` | `fastapi.testclient`, `pytest-asyncio` | REST endpoints, Rate limiters, RBAC, JWT validation, Tool calling |
| **Machine Learning** | `Pytest` + `scikit-learn` | `numpy`, `scipy`, `sklearn.metrics` | ROC-AUC, RMSE, MAE, Silhouette score, Cold-start threshold verification |
| **AI Prompting** | `Pytest` | Deterministic JSON schema validators | Prompt orchestration, entity extraction, hallucination bounds |
| **Offline Sync** | `Vitest` + `Pytest` | Virtualized offline queues, Versioning | Split-brain resolution, idempotency, batch transactions |
| **Web E2E** | `Playwright` | Chromium, Firefox, WebKit headless | Full authentication, task lifecycle, Kairo chat, analytics |

---

## 3. Test Data Strategy & Determinism

1. **Synthetic User Test Fixtures**:
   - Tests execute against isolated synthetic user IDs (`test-user-001`, `test-user-002`, `test-admin-001`).
   - In-memory test stores (`_in_memory_tasks`, `_in_memory_telemetry`, `_in_memory_goals`) are cleared before and after each test execution via `autouse` pytest fixtures.
2. **Clock & Timezone Neutrality**:
   - Time-sensitive tests (quiet hours, streaks, snooze, daily briefings) use explicit ISO timestamp fixtures and parameterized timezones (`UTC`, `Asia/Kolkata`, `America/New_York`, `Europe/London`).
3. **Reproducible ML Seeds**:
   - All synthetic ML datasets use explicit random seeds (`random_state=42`) ensuring zero flaky tests in CI.

---

## 4. Quality Gates & CI Commands

- **Unit & Integration Tests (Web):** `npm test` (in `apps/web`)
- **Type Checking (Web):** `npm run lint:types` (in `apps/web`)
- **Production Build (Web):** `npm run build` (in `apps/web`)
- **Backend & ML Suite:** `python -m pytest` (in `backend`)
- **Web E2E Suite:** `npx playwright test` (in `apps/web`)
