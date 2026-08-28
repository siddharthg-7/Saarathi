# Phase 13 — Saarathi Performance Optimization

You are continuing development of Saarathi, an AI-powered personal productivity platform.

Project:
Saarathi

AI Assistant:
Kairo

Goal:
Optimize Saarathi for fast, smooth, low-resource operation across Web and Mobile without breaking existing functionality.

The application architecture currently includes:

Frontend:
- React
- React Native
- Expo
- Web

Backend:
- FastAPI
- Python

State:
- Zustand
- React Query where already used

Database:
- Firebase Authentication
- Firestore
- Firebase Storage
- Supabase
- pgvector

AI:
- Groq
- Gemini
- Deepgram
- Whisper fallback

Other:
- WebSockets
- Offline-first synchronization
- Notifications
- Behavioral telemetry
- ML predictions
- Long-term memory

Existing Phase 13 status:

[x] Monorepo bundle isolation — 2026-08-04

Remaining:

[ ] Firestore compound indexing & query optimization
[ ] Query batching & pagination
[ ] Image & media asset optimization
[ ] Route-based lazy loading & code splitting
[ ] Background synchronization scheduling
[ ] Local SQLite / MMKV caching for mobile
[ ] Memory leak profiling & battery optimization

==================================================
0. IMPORTANT PRINCIPLE
==================================================

DO NOT optimize blindly.

First inspect the existing implementation.

Measure:

- startup time
- initial render
- route load time
- Firestore reads
- Firestore query latency
- network requests
- bundle size
- memory usage
- unnecessary React renders
- mobile battery usage
- background work
- AI request latency
- WebSocket behavior
- synchronization frequency

Then optimize the actual bottlenecks.

Do not introduce dependencies unless they solve a demonstrated problem.

Do not break:

- authentication
- offline-first behavior
- Firestore synchronization
- notifications
- Kairo
- analytics
- ML
- long-term memory
- security architecture

==================================================
1. PERFORMANCE BASELINE
==================================================

Before making major changes create:

docs/Performance baseline.md

Record the current state where measurable.

Measure:

WEB

- initial page load
- time to interactive
- JavaScript bundle size
- largest chunks
- route loading time
- unnecessary network requests

MOBILE

- cold start
- warm start
- initial render
- memory usage
- JS thread responsiveness
- background activity

BACKEND

- average API latency
- p95 latency where possible
- Firestore query latency
- Supabase query latency
- AI request latency
- WebSocket connection time

DATABASE

- number of Firestore reads
- query patterns
- pagination behavior
- indexes
- repeated queries

Do not invent measurements.

If a metric cannot be measured reliably, explicitly state:

"Not currently measurable."

==================================================
2. FIRESTORE QUERY AUDIT
==================================================

Inspect every Firestore query.

Identify:

- full collection reads
- missing filters
- unnecessary orderBy
- repeated identical queries
- queries triggered on every render
- queries triggered unnecessarily on navigation
- listeners that remain active too long
- listeners that can be scoped more narrowly

Prefer:

specific document reads
+
filtered queries
+
limited results
+
pagination

Avoid:

loading an entire user's historical dataset into memory.

==================================================
3. FIRESTORE COMPOUND INDEXES
==================================================

Inspect existing Firestore queries and determine required composite indexes.

Do not create arbitrary indexes.

Only add indexes required by actual query patterns.

Review important collections such as:

tasks
reminders
notifications
telemetry
analytics
chat
memory metadata

depending on the actual implementation.

Create/update:

firestore.indexes.json

where appropriate.

Document why each important index exists.

==================================================
4. FIRESTORE QUERY OPTIMIZATION
==================================================

Optimize common Saarathi flows.

Examples:

Today's tasks
Upcoming tasks
Overdue tasks
Reminders
Notifications
Analytics
Telemetry
Kairo context
Memory retrieval

Do not fetch:

all historical tasks

when only today's tasks are required.

Use:

where()
orderBy()
limit()
startAfter()

where appropriate.

==================================================
5. PAGINATION
==================================================

Implement pagination for potentially large datasets.

Priority:

- notifications
- telemetry
- chat history
- long-term memories
- analytics history
- completed tasks
- historical reminders

Use cursor-based pagination where appropriate.

Avoid offset-based pagination when Firestore cursor pagination is available.

Example:

first page
   ↓
limit(N)
   ↓
last document
   ↓
startAfter(lastDocument)
   ↓
next page

==================================================
6. QUERY BATCHING
==================================================

Identify sequential requests that can safely be combined.

Avoid:

request A
wait
request B
wait
request C

when the requests are independent.

Use:

Promise.all()

or appropriate batched database operations.

Do not combine requests if doing so increases payload size unnecessarily.

==================================================
7. FIRESTORE WRITE BATCHING
==================================================

Where multiple independent Firestore writes occur together:

use batched writes or transactions when appropriate.

Do NOT use transactions merely for performance.

Use transactions only where atomic read-modify-write behavior is required.

Ensure offline-first behavior continues to work.

==================================================
8. REAL-TIME LISTENER OPTIMIZATION
==================================================

Audit all onSnapshot listeners.

For every listener determine:

- Why does it exist?
- What collection does it watch?
- Is it user-scoped?
- Is the query filtered?
- Is it mounted only while needed?
- Is it unsubscribed correctly?

Prevent:

duplicate listeners
nested listeners
listeners created on every render
listeners surviving navigation unnecessarily

Ensure cleanup:

useEffect()
   ↓
subscribe
   ↓
return unsubscribe

==================================================
9. ZUSTAND OPTIMIZATION
==================================================

Audit Zustand stores.

Avoid subscribing components to the entire store when they only need a small field.

Prefer selective subscriptions.

Bad:

useTaskStore()

when a component only needs:

tasks

Better:

useTaskStore(state => state.tasks)

where appropriate.

Review:

useTaskStore
useNotificationStore
analytics stores
AI/Kairo state
authentication state

Do not rewrite working stores unnecessarily.

==================================================
10. REACT RENDER OPTIMIZATION
==================================================

Identify unnecessary renders.

Inspect:

- large task lists
- analytics graphs
- notification lists
- chat messages
- memory results
- dashboard components

Use memoization only when profiling demonstrates value.

Potential tools:

React.memo
useMemo
useCallback

Do not add memoization everywhere.

Avoid premature optimization.

==================================================
11. LARGE LIST OPTIMIZATION
==================================================

For mobile and web lists:

avoid rendering hundreds/thousands of items simultaneously.

Use appropriate virtualization.

React Native:

FlatList
SectionList

where appropriate.

Review:

task lists
notifications
chat history
analytics event lists
memory results

Ensure stable keys.

Avoid:

array index

as key when stable IDs exist.

==================================================
12. WEB ROUTE-BASED LAZY LOADING
==================================================

Implement route-level lazy loading for large views.

Potential candidates:

Analytics
Kairo
Notifications
Profile
Memory
Settings
Admin
other large views

Use dynamic imports / React.lazy where compatible.

Architecture:

Initial bundle
   ↓
Core dashboard
   ↓
Load feature only when required

Do not lazy-load tiny components where it creates unnecessary complexity.

==================================================
13. CODE SPLITTING
==================================================

Analyze the production bundle.

Identify large dependencies.

Do not remove functionality merely to reduce bundle size.

Prefer:

dynamic imports
tree-shaking
feature isolation

Ensure the initial bundle contains only what is needed for the first screen.

==================================================
14. ASSET OPTIMIZATION
==================================================

Audit:

logos
icons
AI images
avatars
illustrations
audio
uploaded media

Use modern formats where appropriate.

Images should not be larger than necessary.

Avoid shipping huge images for small UI components.

Do not optimize away visual quality unnecessarily.

==================================================
15. IMAGE LOADING
==================================================

Implement where appropriate:

lazy loading
responsive sizing
proper dimensions
caching

Avoid layout shifts by providing known dimensions.

For mobile:

use appropriate image caching.

Do not introduce an external paid image CDN.

Keep the architecture free-first.

==================================================
16. AUDIO OPTIMIZATION
==================================================

Saarathi uses:

Deepgram
Whisper fallback
voice notes
brain dumps
Kairo voice interaction

Review audio pipeline.

Avoid uploading unnecessarily large audio files.

Where appropriate:

compress audio
use suitable formats
stream when useful
delete temporary files after processing

Do not reduce audio quality below what STT requires without testing accuracy.

==================================================
17. BRAIN DUMP PERFORMANCE
==================================================

Existing architecture:

User records audio
      ↓
Upload
      ↓
STT
      ↓
LLM extraction
      ↓
Tasks

Do not block the UI while processing.

Frontend should immediately show:

"Kairo is processing your brain dump..."

Then process asynchronously.

Existing Phase 12 resilience mechanisms must remain compatible.

==================================================
18. KAIRO RESPONSE LATENCY
==================================================

Kairo uses WebSockets.

Optimize:

connection establishment
authentication
message serialization
context retrieval
LLM calls
streaming
memory retrieval

Target:

time-to-first-token should be much lower than full-response latency.

Do not wait for the entire LLM response before displaying streamed output.

==================================================
19. KAIRO CONTEXT SIZE
==================================================

Do not send Kairo the entire user's history.

Use:

relevant task context
+
relevant memory
+
current conversation
+
necessary user preferences

Phase 11 vector retrieval should return only relevant results.

Limit context size.

This improves:

latency
cost
memory
model quality

==================================================
20. AI REQUEST DEDUPLICATION
==================================================

Prevent accidental duplicate AI requests.

Examples:

user double taps
network retries
component remount
WebSocket reconnect

Use request IDs or idempotency where appropriate.

Do not execute the same expensive operation twice unnecessarily.

==================================================
21. AI RESPONSE CACHING
==================================================

Do not blindly cache personalized AI responses.

Only cache when the request is deterministic and safe to reuse.

Potential examples:

static system information
non-personal configuration
repeated identical non-sensitive requests

Do NOT cache personalized Kairo responses globally.

Never allow User A to receive User B's cached response.

Coordinate this with Phase 12 caching.

==================================================
22. BACKGROUND SYNCHRONIZATION
==================================================

Optimize offline-first synchronization.

Current architecture:

local state
   ↓
Firestore offline persistence
   ↓
server synchronization

Do not continuously poll Firestore.

Prefer:

real-time listeners
+
event-driven synchronization
+
controlled background refresh

Avoid unnecessary background work.

==================================================
23. MOBILE BACKGROUND TASKS
==================================================

Inspect Expo background capabilities.

Schedule background work only when necessary.

Potential background tasks:

- synchronization
- reminder reconciliation
- offline queue processing

Do not create a continuously running background process.

Battery usage is a first-class requirement.

==================================================
24. LOCAL MOBILE CACHE
==================================================

Evaluate:

SQLite
MMKV

Do not automatically introduce both.

Choose based on actual data requirements.

Use a local database/cache for data that benefits from fast local access.

Potential candidates:

recent tasks
task metadata
cached analytics
notification state
offline queue
Kairo conversation cache

Do not duplicate Firestore persistence unnecessarily.

==================================================
25. CACHE OWNERSHIP
==================================================

Clearly define:

Firestore = source of truth for cloud data

Local cache = performance/offline layer

Zustand = UI/application state

React Query = server-state cache where already used

Avoid having:

Firestore
+
SQLite
+
Zustand
+
React Query

all independently acting as competing sources of truth.

Document synchronization rules.

==================================================
26. CACHE INVALIDATION
==================================================

Define clear invalidation rules.

When a task changes:

local state
   ↓
optimistic update
   ↓
Firestore
   ↓
listener reconciliation
   ↓
cache update

Prevent stale cached tasks from remaining indefinitely.

==================================================
27. OFFLINE-FIRST PERFORMANCE
==================================================

Offline operations should feel immediate.

Example:

User taps:

Complete Task

UI:

immediately marks complete.

Then:

local persistence
      ↓
Firestore sync
      ↓
server reconciliation

Do not make the UI wait for the network.

Maintain deterministic conflict handling already established.

==================================================
28. MEMORY LEAK AUDIT
==================================================

Inspect:

useEffect
subscriptions
WebSockets
timers
setInterval
setTimeout
Firestore listeners
event listeners
audio recording
audio playback
navigation listeners

Every resource must have cleanup.

Look specifically for:

- WebSocket connections surviving navigation
- duplicate Firestore listeners
- timers surviving unmount
- audio resources not released
- event listeners added repeatedly

==================================================
29. WEB MEMORY PROFILING
==================================================

Use browser profiling tools where possible.

Inspect:

heap growth
detached DOM nodes
long tasks
excessive listeners

Do not claim a memory leak exists unless verified.

Record findings in:

docs/Performance baseline.md

==================================================
30. MOBILE MEMORY PROFILING
==================================================

Inspect:

large arrays
large task datasets
chat history
audio buffers
analytics data
image caches

Do not keep entire historical datasets in React state.

Load only what the screen needs.

==================================================
31. BATTERY OPTIMIZATION
==================================================

Minimize:

background network calls
GPS/location usage if any
timers
polling
audio processing
continuous WebSocket reconnections

Use event-driven behavior wherever possible.

Notifications should be scheduled by the appropriate platform mechanism rather than a constantly running JS timer.

==================================================
32. NOTIFICATION PERFORMANCE
==================================================

Review Phase 7.

Avoid:

polling every second
recreating all reminders unnecessarily
rescheduling unchanged notifications

When a task changes:

only reconcile affected reminder(s).

Do not rebuild the entire notification schedule for every task mutation.

==================================================
33. ANALYTICS PERFORMANCE
==================================================

Phase 8 analytics must not process massive datasets on every screen render.

Avoid:

fetch entire telemetry history
then calculate everything on the client

Prefer:

aggregated metrics
precomputed summaries
bounded date ranges
server-side aggregation where appropriate

Examples:

today
last 7 days
last 30 days

rather than entire lifetime history.

==================================================
34. GRAPH PERFORMANCE
==================================================

Analytics graphs should receive only the data points required.

Do not render thousands of points when the graph visually requires only hundreds.

Aggregate when necessary.

Ensure graph rendering does not block task interactions.

==================================================
35. ML PERFORMANCE
==================================================

Phase 9 behavioral ML should not execute expensive inference on every render.

Only run prediction when:

relevant input changes
or
a prediction becomes stale.

Cache appropriate model outputs.

Do not repeatedly recompute the same prediction.

==================================================
36. XAI PERFORMANCE
==================================================

Phase 10 explanations should not significantly slow normal task interactions.

Only calculate detailed explanation data when:

a prediction is generated
or
the user requests an explanation.

Do not calculate SHAP/explainability for every task on every dashboard render.

==================================================
37. LONG-TERM MEMORY PERFORMANCE
==================================================

Phase 11 vector search should be bounded.

Use:

top-K retrieval
metadata filters
user ID filtering
reasonable embedding search limits

Do not retrieve the entire vector database.

Hybrid search should combine:

semantic similarity
+
keyword/full-text relevance

without unnecessarily duplicating expensive queries.

==================================================
38. API RESPONSE SIZE
==================================================

Review API responses.

Avoid sending unnecessary fields.

Use response models.

For lists:

return only required fields.

Avoid:

entire user objects
entire task histories
large nested structures

when the UI needs only a subset.

==================================================
39. PAGINATED API DESIGN
==================================================

For large backend responses use:

limit
cursor
hasMore

or equivalent.

Example:

{
  "items": [...],
  "nextCursor": "...",
  "hasMore": true
}

Do not return unbounded arrays.

==================================================
40. NETWORK OPTIMIZATION
==================================================

Identify duplicate requests.

Use:

request deduplication
caching
parallel requests
conditional fetching

where appropriate.

Do not create aggressive polling.

==================================================
41. PREFETCHING
==================================================

Use cautious prefetching for predictable navigation.

Example:

When dashboard opens, it may be reasonable to prepare:

Analytics summary
Notifications count

if profiling shows value.

Do not prefetch large datasets that users may never open.

==================================================
42. PERFORMANCE BUDGETS
==================================================

Establish practical targets.

WEB:

- fast initial dashboard rendering
- minimal initial JS
- no unnecessary blocking requests

MOBILE:

- responsive interactions
- low memory overhead
- minimal background work

API:

- fast normal CRUD responses
- streaming AI responses
- bounded database queries

Do not fabricate exact benchmarks.

Record actual measured values.

==================================================
43. REGRESSION TESTING
==================================================

After optimization verify:

Authentication
Tasks
Task completion
Task creation
Task editing
Reminders
Notifications
Offline mode
Online synchronization
Conflict resolution
Kairo
Brain Dump
STT
TTS
Analytics
ML predictions
XAI
Long-term memory
WebSockets

Nothing should regress.

==================================================
44. PERFORMANCE TESTS
==================================================

Create tests for:

pagination
query limits
cache invalidation
listener cleanup
duplicate request prevention
notification scheduling efficiency
offline synchronization
WebSocket cleanup
large task lists
large notification lists

Where possible test:

100
1,000
10,000

records.

Do not load all records into memory if the architecture should paginate them.

==================================================
45. SECURITY COMPATIBILITY
==================================================

Do NOT sacrifice Phase 14 security for performance.

Never:

disable authorization
weaken Firestore rules
remove RLS
expose secrets
skip JWT verification
allow global vector searches
cache private responses globally

Performance improvements must preserve security boundaries.

==================================================
46. FREE-FIRST ARCHITECTURE
==================================================

Saarathi is intentionally being built with a $0/free-first architecture.

Do not introduce paid infrastructure simply for optimization.

Avoid unnecessary:

CDNs
paid caching services
paid monitoring
paid databases
paid queues

Prefer existing:

Firebase
Supabase free tier
browser APIs
Expo
local storage
SQLite/MMKV where justified
FastAPI
WebSockets

If a production-scale optimization eventually requires paid infrastructure, document it as a future scaling option rather than making it mandatory now.

==================================================
47. DOCUMENT ARCHITECTURE
==================================================

Create/update:

docs/Performance architecture.md

Document:

- Firestore query strategy
- pagination
- caching
- Zustand state
- React Query usage
- local mobile storage
- offline synchronization
- WebSocket lifecycle
- AI streaming
- background synchronization
- analytics aggregation
- ML inference caching
- memory search limits

==================================================
48. FINAL PERFORMANCE AUDIT
==================================================

Before declaring completion answer:

1. What was slow?
2. What changed?
3. Why was each change necessary?
4. What measurements improved?
5. What did not improve?
6. What trade-offs were introduced?
7. What remains a bottleneck?

Do not claim:

"sub-second"

unless it was actually measured.

==================================================
49. REQUIRED FINAL REPORT
==================================================

After implementation provide:

### 1. Baseline

Measured performance before optimization.

### 2. Firestore

- indexes
- query improvements
- pagination
- listener optimization

### 3. Frontend

- lazy loading
- code splitting
- rendering optimization
- bundle changes

### 4. Mobile

- local cache
- memory
- battery
- background synchronization

### 5. Backend

- API latency
- batching
- caching
- WebSocket optimization

### 6. AI

- Kairo latency
- streaming
- context optimization
- request deduplication
- caching

### 7. Analytics/ML

- aggregation
- prediction caching
- graph optimization

### 8. Memory

- long-term memory retrieval optimization

### 9. Tests

Provide exact results.

### 10. Build

Run:

npm run lint:types
npm test
npm run build

Backend:

pytest

### 11. Regression

Confirm existing Saarathi functionality remains operational.

### 12. Remaining bottlenecks

Be honest.

==================================================
50. DEFINITION OF DONE
==================================================

Phase 13 can be marked complete only when:

[x] Monorepo bundle isolation
[ ] Firestore indexes optimized
[ ] Firestore queries optimized
[ ] Pagination implemented where required
[ ] Query batching implemented where beneficial
[ ] Real-time listeners audited
[ ] Image assets optimized
[ ] Audio pipeline optimized
[ ] Route-based lazy loading
[ ] Code splitting
[ ] Background synchronization optimized
[ ] Mobile cache strategy implemented
[ ] Memory leaks audited
[ ] Battery usage reviewed
[ ] Kairo latency optimized
[ ] WebSocket lifecycle optimized
[ ] Analytics processing optimized
[ ] ML inference optimized
[ ] Long-term memory retrieval optimized
[ ] Performance tests
[ ] Regression tests
[ ] Documentation updated
[ ] Production build passes

==================================================
FINAL RULE
==================================================

Optimize Saarathi based on evidence.

DO NOT:

- rewrite stable architecture unnecessarily
- add dependencies without justification
- add caching everywhere
- create unnecessary indexes
- load entire datasets
- introduce continuous polling
- keep unnecessary listeners alive
- sacrifice security
- sacrifice offline-first behavior
- introduce paid services unnecessarily

The goal is:

FAST
+
RESPONSIVE
+
LOW RESOURCE USAGE
+
OFFLINE FRIENDLY
+
SECURE
+
FREE-FIRST

while preserving all existing Saarathi functionality.