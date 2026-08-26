# Phase 12 — Saarathi Resilience & Reliability Engine

You are continuing development of Saarathi, an AI-powered personal productivity platform.

AI assistant: Kairo

The previous phases are already implemented:

- Phase 7 — Notification & Smart Reminder Engine
- Phase 8 — Analytics & Behavioral Telemetry
- Phase 9 — Behavioral ML
- Phase 10 — Explainable AI (XAI)
- Phase 11 — Long-Term Memory & Hybrid Retrieval

Phase 12 is partially implemented.

Existing completed capability:

- Groq LLM fallback to Gemini on rate limit/outage
- Existing implementation: backend/app/services/ai_service.py

Your job is to complete Phase 12 without breaking existing functionality.

==================================================
OBJECTIVE
==================================================

Make Saarathi resilient to:

- temporary API outages
- rate limits
- network failures
- provider timeouts
- backend restarts
- AI provider degradation
- Deepgram failures
- temporary loss of connectivity
- interrupted voice processing
- duplicate requests
- transient Firestore/Supabase failures

The core principle is:

Saarathi must degrade gracefully rather than fail completely.

If an AI feature becomes unavailable, the core Todo application must continue working.

==================================================
IMPORTANT ARCHITECTURAL RULE
==================================================

Before changing anything:

INSPECT the existing codebase.

Specifically inspect:

backend/app/services/ai_service.py
backend/app/api/
backend/app/workers/
backend/app/services/
packages/api/
packages/store/
apps/web/
apps/mobile/
Phase 7 notification engine
Phase 8 telemetry
Phase 9 ML
Phase 10 XAI
Phase 11 memory system

Determine:

- existing HTTP client
- existing async infrastructure
- existing Celery/background workers
- existing WebSocket implementation
- existing Firebase integration
- existing Supabase integration
- existing Deepgram integration
- existing Groq integration
- existing Gemini integration
- existing local storage
- existing audio recording implementation
- existing error handling
- existing logging system
- existing environment configuration

DO NOT introduce duplicate infrastructure if an existing implementation can be extended.

==================================================
PART 1 — RESILIENCE ARCHITECTURE
==================================================

Implement a shared resilience layer.

Architecture:

Client
   |
   ▼
Saarathi Backend
   |
   ▼
Resilience Layer
   |
   ├── Retry
   ├── Timeout
   ├── Circuit Breaker
   ├── Cache
   ├── Provider Fallback
   └── Offline Queue
   |
   ▼
External Provider

The resilience layer should be reusable.

Do not implement separate inconsistent retry logic in every service.

Create a shared abstraction where appropriate.

==================================================
PART 2 — EXPONENTIAL BACKOFF
==================================================

Implement exponential backoff with jitter.

Base concept:

delay = min(maxDelay, baseDelay * 2^attempt)

Then apply jitter.

Example:

attempt 0
   ↓
small delay

attempt 1
   ↓
larger delay

attempt 2
   ↓
larger delay

attempt 3
   ↓
maximum delay

Use configurable values.

Example configuration:

MAX_RETRIES
INITIAL_DELAY_MS
MAX_DELAY_MS
JITTER_RATIO

Do not hardcode these throughout the codebase.

==================================================
PART 3 — RETRY ONLY TRANSIENT ERRORS
==================================================

Retry appropriate failures such as:

- HTTP 429
- HTTP 500
- HTTP 502
- HTTP 503
- HTTP 504
- connection reset
- temporary DNS/network failure
- provider timeout

Do NOT retry blindly for:

- HTTP 400
- HTTP 401
- HTTP 403
- invalid API key
- malformed request
- invalid model
- unsupported request
- validation errors

The system must distinguish transient from permanent failures.

==================================================
PART 4 — IDEMPOTENCY
==================================================

Retries can accidentally create duplicate operations.

Implement idempotency for operations where duplication is harmful.

Examples:

- Brain Dump processing
- task creation
- reminder creation
- audio processing
- memory indexing
- notification dispatch

Use a deterministic request/job ID where appropriate.

Example:

userId + operationType + sourceId + operationVersion

Before processing:

check whether the operation has already completed.

If yes:

return the existing result.

Do not process it twice.

==================================================
PART 5 — CIRCUIT BREAKERS
==================================================

Implement circuit breakers for external providers.

Providers may include:

Groq
Gemini
Deepgram
Supabase
Firebase
other external AI providers

Circuit states:

CLOSED
   ↓
normal operation

OPEN
   ↓
provider temporarily bypassed

HALF_OPEN
   ↓
test provider recovery

Example:

Provider fails repeatedly
       ↓
Circuit opens
       ↓
Requests stop hitting provider
       ↓
Fallback provider is used
       ↓
Cooldown expires
       ↓
Half-open test request
       ↓
Success
       ↓
Circuit closes

Do not continuously hammer an unavailable provider.

==================================================
PART 6 — CIRCUIT BREAKER CONFIGURATION
==================================================

Make configurable:

failure threshold
success threshold
open duration
half-open request count
timeout

Example conceptual configuration:

CIRCUIT_FAILURE_THRESHOLD
CIRCUIT_OPEN_DURATION
CIRCUIT_HALF_OPEN_REQUESTS

Do not expose internal circuit state to normal users.

==================================================
PART 7 — KAIRO LLM FALLBACK
==================================================

Existing:

Groq → Gemini fallback

Keep this architecture.

Improve it to:

Primary provider
      ↓
Timeout / rate limit / outage
      ↓
Retry transient error
      ↓
If still failing
      ↓
Circuit breaker
      ↓
Fallback provider
      ↓
Return response

Do not automatically fallback on malformed requests.

Example:

Groq 429
   ↓
retry with backoff
   ↓
still failing
   ↓
Gemini

Example:

Groq 400 invalid request
   ↓
DO NOT retry
   ↓
return validation error

==================================================
PART 8 — PROVIDER HEALTH
==================================================

Create internal provider health information.

Example:

ProviderHealth:

provider
status
failureCount
successCount
lastFailure
lastSuccess
circuitState
latency
lastErrorCategory

Use this for internal diagnostics.

Do not expose sensitive provider details to users.

==================================================
PART 9 — LLM RESPONSE CACHE
==================================================

Implement intelligent caching for safe, repeatable AI requests.

Do NOT cache every Kairo response.

Dynamic conversational responses may depend on:

- current time
- current tasks
- energy level
- memory context
- analytics
- recent conversation
- notification state

Therefore cache only requests that are sufficiently deterministic.

Potential candidates:

- static productivity explanations
- repeated general knowledge prompts
- system-generated classification requests
- repeated identical non-personal transformations

Do not cache personalized responses unless the cache key includes all relevant context.

==================================================
PART 10 — CACHE KEY
==================================================

Create deterministic cache keys.

Concept:

hash(
 provider/model
 prompt
 systemPromptVersion
 relevantContext
 memoryContextVersion
 toolVersion
 locale
 featureVersion
)

If any meaningful context changes, the cache should not incorrectly return an old answer.

==================================================
PART 11 — CACHE TTL
==================================================

Every cached result must have a TTL.

Example categories:

short-lived
medium-lived
long-lived

Make TTL configurable.

Do not create an infinite AI response cache.

==================================================
PART 12 — CACHE INVALIDATION
==================================================

Invalidate relevant cached data when:

- user profile changes
- task context changes
- memory changes
- AI system prompt changes
- model changes
- feature version changes

Use versioned cache keys where practical rather than trying to manually invalidate every possible key.

==================================================
PART 13 — CACHE FAILURE SAFETY
==================================================

If cache storage is unavailable:

Kairo must still work.

Cache is an optimization.

It must never become a dependency for basic AI functionality.

==================================================
PART 14 — DEEPGRAM STT RESILIENCE
==================================================

Implement:

Deepgram
   ↓
timeout / transient failure
   ↓
retry with backoff
   ↓
failure
   ↓
fallback STT provider

Preferred fallback:

Whisper-compatible local/self-hosted implementation if practical.

If the project cannot reasonably run Whisper locally on the target environment:

create a provider abstraction so another compatible STT provider can be configured without changing the Kairo audio pipeline.

Do not introduce a paid provider unnecessarily.

==================================================
PART 15 — STT PROVIDER ABSTRACTION
==================================================

Create an interface similar to:

STTProvider

transcribe(audio)
isAvailable()
getCapabilities()

Implementation:

DeepgramSTTProvider

Fallback:

WhisperSTTProvider

Kairo should depend on the interface, not directly on Deepgram.

==================================================
PART 16 — AUDIO NORMALIZATION
==================================================

Before sending audio to STT:

validate:

- file exists
- file type
- duration
- file size
- supported codec

Reject invalid audio cleanly.

Do not repeatedly upload invalid files.

==================================================
PART 17 — OFFLINE AUDIO QUEUE
==================================================

Implement offline-first audio processing.

Mobile flow:

User records Brain Dump
        ↓
Audio saved locally
        ↓
Network unavailable
        ↓
Queue locally
        ↓
Show:
"Saved — Kairo will process this when you're back online."
        ↓
Network returns
        ↓
Upload
        ↓
STT
        ↓
Groq/Gemini extraction
        ↓
Tasks generated
        ↓
Firestore sync

The user's audio must not be lost because of temporary connectivity failure.

==================================================
PART 18 — AUDIO QUEUE MODEL
==================================================

Create a durable local queue.

Concept:

OfflineAudioJob:

id
userId
localFilePath
createdAt
status
retryCount
lastAttemptAt
nextAttemptAt
errorCode
errorMessage
checksum
remoteId

Statuses:

queued
uploading
uploaded
processing
completed
failed
retry_wait
cancelled

==================================================
PART 19 — AUDIO DUPLICATE PREVENTION
==================================================

Calculate a checksum/hash for audio where practical.

If the same audio is submitted twice:

do not unnecessarily process it twice.

Use:

userId
audioHash
operationVersion

as part of deduplication.

==================================================
PART 20 — RECONNECT PROCESSING
==================================================

When connectivity returns:

process queued audio jobs.

Do not upload all jobs simultaneously.

Use controlled concurrency.

Example:

2–3 jobs at a time.

Make concurrency configurable.

==================================================
PART 21 — MOBILE APP RESTART
==================================================

The queue must survive:

- app closing
- app restart
- temporary crash
- device reboot where platform storage permits

Do NOT store only in memory.

Use persistent local storage appropriate to the existing Expo architecture.

==================================================
PART 22 — BRAIN DUMP PIPELINE
==================================================

Final resilient architecture:

Voice recording
      ↓
Local file
      ↓
Offline queue
      ↓
Upload
      ↓
Deepgram
      ↓
STT fallback
      ↓
Transcript
      ↓
Kairo extraction
      ↓
Groq
      ↓
Gemini fallback
      ↓
Task extraction
      ↓
Firestore
      ↓
Analytics telemetry
      ↓
Memory indexing

A failure in one stage must not destroy successful earlier stages.

For example:

If task extraction fails after transcription succeeds:

store the transcript.

Allow retry from the failed stage.

Do not force the user to record the audio again.

==================================================
PART 23 — CHECKPOINTING
==================================================

For multi-stage processing, persist intermediate state.

Example:

Audio
   ↓
Transcript saved
   ↓
Task extraction
   ↓
Tasks saved

If task extraction fails:

resume from transcript.

Do not repeat Deepgram unnecessarily.

==================================================
PART 24 — NETWORK AWARENESS
==================================================

Implement network state detection on mobile and web where appropriate.

States:

online
offline
unstable

Do not repeatedly attempt network calls while clearly offline.

Queue them instead.

==================================================
PART 25 — FIREBASE RESILIENCE
==================================================

Inspect existing Firestore offline persistence.

Ensure:

- task mutations remain usable offline
- optimistic UI remains responsive
- synchronization occurs when connectivity returns
- duplicate mutations are avoided

Do not replace Firestore's native offline mechanism unnecessarily.

Maintain the existing server timestamp strategy from earlier phases.

==================================================
PART 26 — SUPABASE RESILIENCE
==================================================

Supabase is used by Phase 11 for long-term memory.

If Supabase is temporarily unavailable:

- Firestore operations continue
- memory indexing is queued
- retries occur later
- Kairo can operate without long-term memory temporarily

Memory indexing must be eventually consistent.

==================================================
PART 27 — WEBSOCKET RESILIENCE
==================================================

Kairo uses WebSockets for streaming.

Implement:

connection timeout
heartbeat
automatic reconnect
exponential reconnect delay
maximum reconnect attempts
connection state

States:

connecting
connected
reconnecting
disconnected

If the WebSocket fails:

attempt reconnect.

If streaming cannot be restored:

fall back to a normal request/response endpoint where possible.

==================================================
PART 28 — STREAM INTERRUPTION
==================================================

If Kairo streaming is interrupted halfway:

Do not lose the user request.

Client should be able to:

- reconnect
- resume where supported
- or retry the request safely

Use request IDs.

Avoid duplicate AI responses.

==================================================
PART 29 — TIMEOUTS
==================================================

Every external operation must have a timeout.

Examples:

LLM request
STT request
embedding request
database request
HTTP request
WebSocket handshake

Do not allow a request to hang indefinitely.

Use separate configurable timeout values by operation.

==================================================
PART 30 — ERROR CLASSIFICATION
==================================================

Create normalized internal error categories.

Example:

TRANSIENT_NETWORK
RATE_LIMITED
PROVIDER_TIMEOUT
PROVIDER_UNAVAILABLE
AUTHENTICATION_ERROR
INVALID_REQUEST
VALIDATION_ERROR
DATABASE_UNAVAILABLE
UNKNOWN

Do not expose raw provider stack traces to users.

==================================================
PART 31 — USER-FACING ERROR MESSAGES
==================================================

Convert internal errors into clear messages.

Bad:

"HTTP 503 aiohttp.ClientResponseError..."

Good:

"Kairo is temporarily having trouble reaching its AI service. Your request is safe — please try again."

For offline audio:

"Saved locally. Kairo will process your voice note when your connection returns."

For memory:

"I couldn't access your long-term memory right now, but Kairo is still available."

==================================================
PART 32 — TELEMETRY
==================================================

Integrate resilience events with the existing Phase 8 telemetry system.

Track:

provider_request
provider_success
provider_failure
provider_timeout
provider_rate_limit
retry_started
retry_exhausted
circuit_opened
circuit_half_open
circuit_closed
fallback_used
cache_hit
cache_miss
audio_queued
audio_retry
audio_completed
audio_failed
websocket_reconnect
offline_operation_queued

Do NOT record sensitive prompt/audio content unnecessarily.

==================================================
PART 33 — ANALYTICS
==================================================

Expose aggregated reliability metrics internally:

Provider success rate
Provider failure rate
Fallback rate
Average latency
P95 latency
Retry rate
Cache hit rate
Circuit-open duration
Audio processing success rate
Offline queue completion rate

Use these metrics to identify reliability problems.

==================================================
PART 34 — RATE LIMIT PROTECTION
==================================================

Prevent Saarathi itself from unnecessarily hammering external providers.

Implement:

request throttling
concurrency limits
provider-specific limits

Respect provider responses such as:

HTTP 429
Retry-After

When available, use the provider's retry timing rather than blindly choosing a delay.

==================================================
PART 35 — BACKPRESSURE
==================================================

If many Brain Dumps are queued:

Do not process unlimited jobs simultaneously.

Use bounded concurrency.

Example:

Queue:
100 jobs

Workers:
3

Process gradually.

Do not create 100 simultaneous API calls.

==================================================
PART 36 — PRIORITY QUEUES
==================================================

If useful, prioritize:

HIGH:
interactive Kairo request

MEDIUM:
Brain Dump

LOW:
historical memory indexing

A user's current interaction should not be blocked by background memory indexing.

==================================================
PART 37 — GRACEFUL DEGRADATION
==================================================

Define explicit degradation levels.

LEVEL 0:
Everything healthy.

LEVEL 1:
Primary provider degraded.
Use fallback.

LEVEL 2:
AI provider unavailable.
Basic task management continues.

LEVEL 3:
Memory unavailable.
Kairo operates without long-term context.

LEVEL 4:
Network unavailable.
Local/offline functionality continues.

The Todo application should remain usable even when AI is completely unavailable.

==================================================
PART 38 — NEVER BREAK CORE TODO FEATURES
==================================================

These features must continue independently of AI:

- create task
- edit task
- complete task
- delete task
- view tasks
- reminders
- local notifications
- offline task operations

AI is an enhancement, not a dependency.

==================================================
PART 39 — TESTING
==================================================

Create unit and integration tests.

Test:

RETRY

- retry on 429
- retry on 500
- retry on timeout
- no retry on 400
- no retry on 401
- exponential delay
- jitter
- maximum retries

CIRCUIT BREAKER

- closed state
- threshold
- open state
- half-open state
- recovery
- repeated failure

FALLBACK

- Groq → Gemini
- Deepgram → Whisper/fallback
- provider recovery

CACHE

- cache hit
- cache miss
- TTL
- invalidation
- context-aware key
- cache failure

OFFLINE AUDIO

- queue while offline
- persist queue
- reconnect
- retry
- duplicate prevention
- app restart
- failed processing
- checkpoint resume

WEBSOCKET

- reconnect
- timeout
- stream interruption
- duplicate prevention

DATABASE

- Firestore unavailable
- Supabase unavailable
- eventual retry

SECURITY

- user isolation
- no secret exposure
- no unauthorized job access

==================================================
PART 40 — CHAOS / FAILURE TESTING
==================================================

Simulate:

Groq unavailable
Gemini unavailable
Deepgram unavailable
Supabase unavailable
Firebase unavailable
network offline
network restored
429 responses
500 responses
timeouts
WebSocket disconnect
app restart during upload
app restart during processing

Expected result:

Saarathi should degrade gracefully rather than crash.

==================================================
PART 41 — ACCEPTANCE CRITERIA
==================================================

Phase 12 is complete only when:

- [x] Groq → Gemini fallback remains functional
- [ ] Exponential backoff implemented
- [ ] Jitter implemented
- [ ] Retry classification implemented
- [ ] Circuit breaker implemented
- [ ] Provider health tracking implemented
- [ ] Intelligent AI caching implemented
- [ ] Cache invalidation implemented
- [ ] Deepgram provider abstraction implemented
- [ ] Whisper/fallback STT implemented or pluggable
- [ ] Offline audio queue implemented
- [ ] Persistent audio queue implemented
- [ ] Audio retry implemented
- [ ] Audio checkpointing implemented
- [ ] Duplicate audio processing prevented
- [ ] WebSocket reconnect implemented
- [ ] Streaming interruption handled
- [ ] Request timeouts implemented
- [ ] Error classification implemented
- [ ] Graceful degradation implemented
- [ ] Phase 8 resilience telemetry integrated
- [ ] Firestore offline behavior verified
- [ ] Supabase memory indexing can recover from failure
- [ ] Core Todo functionality works without AI
- [ ] Automated tests pass

==================================================
PART 42 — VALIDATION
==================================================

Run:

npm run lint:types
npm test
npm run build

Also run:

backend tests
integration tests
database tests

Verify:

0 TypeScript errors
0 production build errors
0 critical backend errors
0 security failures
0 failing resilience tests

Perform manual end-to-end tests.

TEST 1:

Turn off network.

Create task.

Expected:

Task remains usable locally.

TEST 2:

Turn off network.

Record Brain Dump.

Expected:

Audio is saved locally and queued.

TEST 3:

Restore network.

Expected:

Audio uploads automatically.

TEST 4:

Simulate Deepgram failure.

Expected:

Fallback STT is attempted.

TEST 5:

Simulate Groq 429.

Expected:

Retry occurs with exponential backoff.

Then:

Gemini fallback.

TEST 6:

Simulate repeated Groq failures.

Expected:

Circuit breaker opens.

TEST 7:

Restore Groq.

Expected:

Half-open recovery test succeeds.

Circuit closes.

TEST 8:

Disconnect Kairo WebSocket.

Expected:

Automatic reconnect.

TEST 9:

Disable Supabase.

Expected:

Core Todo functionality continues.

Memory indexing retries later.

TEST 10:

Attempt User A memory search using User B identity.

Expected:

Zero results/access denied.

==================================================
PART 43 — FINAL IMPLEMENTATION REPORT
==================================================

After implementation provide:

1. Files created
2. Files modified
3. Existing architecture reused
4. Retry architecture
5. Circuit breaker architecture
6. Provider fallback architecture
7. Cache architecture
8. Deepgram/Whisper architecture
9. Offline audio queue architecture
10. WebSocket resilience
11. Error classification
12. Graceful degradation strategy
13. Telemetry integration
14. Environment variables
15. Database/schema changes
16. Tests performed
17. Failure simulations performed
18. Build results
19. Known platform limitations
20. Remaining Phase 12 work, if any
21. Readiness for Phase 13

DO NOT claim Phase 12 is complete unless the acceptance criteria have actually been tested.

==================================================
FINAL DESIGN PRINCIPLE
==================================================

Saarathi should follow:

FAILURE
   ↓
CLASSIFY
   ↓
RETRY IF TRANSIENT
   ↓
CIRCUIT BREAK IF PERSISTENT
   ↓
FALLBACK
   ↓
QUEUE IF OFFLINE
   ↓
RECOVER
   ↓
RESUME

And most importantly:

AI FAILURE ≠ SAARATHI FAILURE

The core productivity application must remain usable even when every external AI provider is unavailable.