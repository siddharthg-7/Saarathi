# Saarathi QA & Edge-Case Findings Ledger

**Version:** 1.0.0  
**Phase:** Phase 15 — Testing & Quality Assurance  

---

## 1. Quality Ledger & Edge-Case Findings

### Finding 1: Rapid Task Toggle Optimistic Rollback
- **Component**: `useTaskStore` / `syncService`
- **Scenario**: User toggles completion on/off 5 times in < 500ms during unstable network conditions.
- **Root Cause**: Unversioned updates could arrive out-of-order at Firestore and leave UI in a stale state.
- **Resolution**: Enforced versioned optimistic mutation counters (`version: increment(1)`) with deterministic conflict reconciliation in `executeVersionedTransaction`.
- **Status**: ✅ **VERIFIED & RESOLVED**

### Finding 2: Empty or Massive Brain Dump Audio Transcripts
- **Component**: `backend/app/api/brain_dump.py` / `prompt_orchestration.py`
- **Scenario**: Ambient silence producing empty transcript `""` or massive rambling transcript > 10,000 characters.
- **Root Cause**: Could trigger unnecessary LLM token burns or raise uncaught parsing exceptions.
- **Resolution**: Added transcript pre-validation (rejecting whitespace-only inputs) and bounded chunking with graceful fallback tasks.
- **Status**: ✅ **VERIFIED & RESOLVED**

### Finding 3: Memory Prompt Token Inflation
- **Component**: `backend/app/services/prompt_orchestration.py`
- **Scenario**: Vector search returning dense context that inflates prompt size and exceeds LLM latency budgets.
- **Root Cause**: Context length was unbounded.
- **Resolution**: Clamped memory context string to 2,500 characters and top-10 active tasks / top-5 goals.
- **Status**: ✅ **VERIFIED & RESOLVED**

### Finding 4: In-Memory / ADC Fallback for Local Development & CI
- **Component**: `backend/app/services/firestore_service.py`
- **Scenario**: Running test suites without Google Application Default Credentials (ADC) or internet connectivity.
- **Root Cause**: Cloud Firestore client initialization errors.
- **Resolution**: Built resilient, isolated in-memory stores (`_in_memory_tasks`, `_in_memory_telemetry`, `_in_memory_goals`) providing full query filtering, pagination, and transactional semantics during tests.
- **Status**: ✅ **VERIFIED & RESOLVED**
