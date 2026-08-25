# Phase 11 — Saarathi Long-Term Memory & Hybrid Semantic Retrieval

You are continuing development of **Saarathi**, an AI-powered personal productivity operating system.

The AI assistant is called **Kairo**.

The following phases have already been implemented:

* Phase 7 — Notification & Smart Reminder Engine
* Phase 8 — Analytics & Behavioral Telemetry
* Phase 9 — Behavioral ML
* Phase 10 — Explainable AI

Your task is to implement:

# Phase 11 — Long-Term Memory

The objective is to give Kairo persistent, searchable, user-scoped memory across:

* Kairo conversations
* Notes
* Brain dumps
* Goals
* Tasks
* Relevant task history
* Productivity insights
* User-created knowledge

Kairo should be able to answer questions using relevant information from the user's past without requiring the user to manually repeat it.

---

# 1. CORE PRINCIPLE

Saarathi must distinguish between:

```text
OPERATIONAL DATA
```

and:

```text
SEMANTIC MEMORY
```

Firebase/Firestore remains the primary operational database.

Supabase PostgreSQL + pgvector becomes the semantic memory and retrieval layer.

Architecture:

```text
                 SAARATHI
                     │
          ┌──────────┴──────────┐
          │                     │
      Firestore              Supabase
      Operational            Memory
          │                     │
      Tasks                  Memories
      Users                  Embeddings
      Habits                 Full Text
      Reminders              Metadata
      Goals
          │                     │
          └──────────┬──────────┘
                     │
                 Kairo API
                     │
              Hybrid Retrieval
                     │
              Context Builder
                     │
                    LLM
```

Do NOT migrate existing Firestore application data to Supabase unnecessarily.

---

# 2. FIRST STEP — INSPECT THE EXISTING SYSTEM

Before implementation, inspect:

```text
Phase 8 telemetry architecture
Phase 9 ML architecture
Phase 10 XAI architecture
Kairo AI service
Kairo WebSocket service
Firestore task schema
Firestore notes schema
Brain Dump implementation
Goals implementation
Chat history implementation
Existing API package
Existing FastAPI backend
Existing authentication
Existing environment configuration
```

Identify:

* where Kairo conversations are stored
* where notes are stored
* where brain dumps are stored
* where goals are stored
* where tasks are stored
* how Firebase user IDs are represented
* how backend authentication works
* how Kairo currently builds prompts
* whether embeddings or vector infrastructure already exists

Do NOT create duplicate storage systems.

Extend the existing architecture.

---

# 3. MEMORY SOURCES

Create a controlled memory-source taxonomy.

Supported sources:

```text
kairo_chat
note
brain_dump
goal
task
task_history
analytics_insight
user_preference
```

Do NOT automatically embed every piece of application data.

Only store information that can provide useful long-term contextual value.

---

# 4. WHAT SHOULD BECOME MEMORY?

Examples:

### Good memory

> User wants to become an AI engineer.

### Good memory

> User is building Saarathi as a personal productivity application.

### Good memory

> User prefers studying DSA in the morning.

### Good memory

> User mentioned a startup idea involving AI-powered education.

### Good memory

> User's goal is to complete a particular project by a certain date.

### Poor memory

> User opened the settings screen.

### Poor memory

> User clicked a button.

### Poor memory

> Temporary API error occurred.

Do not turn meaningless telemetry into semantic memory.

Phase 8 telemetry remains telemetry.

---

# 5. MEMORY DATA MODEL

Create a strongly typed memory model.

Suggested:

```text id="2xy9z7"
Memory {
  id
  userId

  sourceType
  sourceId

  content
  summary

  embedding

  metadata

  importance
  confidence

  createdAt
  updatedAt
  lastAccessedAt

  validFrom
  validUntil

  isActive
  deletedAt
}
```

Adapt naming to the existing project conventions.

---

# 6. MEMORY METADATA

Metadata should include only useful retrieval information.

Example:

```json id="xukx1r"
{
  "sourceType": "brain_dump",
  "category": "project",
  "tags": [
    "startup",
    "AI",
    "education"
  ],
  "createdAt": "...",
  "importance": 0.8
}
```

Potential metadata:

```text
category
tags
sourceType
sourceId
taskId
goalId
projectId
date
timezone
language
importance
```

Do not store unnecessary personal information.

---

# 7. USER ISOLATION

This is critical.

Every memory MUST belong to exactly one authenticated user.

Example:

```text id="ubn4l8"
userId
```

Never perform an unrestricted vector search across all users.

Every retrieval query must include user scope.

Correct:

```text id="6y5u1s"
WHERE user_id = authenticated_user_id
```

Incorrect:

```text id="9u9j4v"
search all memories
then filter afterward
```

User isolation must happen at the database/query layer.

---

# 8. SUPABASE MEMORY DATABASE

Use:

**Supabase PostgreSQL + pgvector**

Do not introduce Pinecone unless the existing project genuinely requires it.

The goal is to minimize infrastructure complexity.

Enable the PostgreSQL vector extension.

Create a dedicated memory table.

Example conceptual schema:

```text id="q35qjy"
memories

id
user_id
source_type
source_id
content
summary
embedding
search_vector
metadata
importance
confidence
created_at
updated_at
last_accessed_at
valid_from
valid_until
is_active
deleted_at
```

Use a vector column with the embedding dimension appropriate for the selected embedding model.

Do NOT hardcode an incorrect dimension.

Determine the dimension from the actual embedding model being used.

---

# 9. EMBEDDING MODEL

Implement an abstraction around embedding generation.

Do not tightly couple the entire application to one provider.

Example interface:

```text id="fbne4f"
EmbeddingProvider

generateEmbedding(text)
generateEmbeddings(texts)
getDimensions()
```

The implementation can use:

**Sentence Transformers**

as specified in the Saarathi architecture.

The exact model should be selected based on:

* embedding quality
* model size
* inference cost
* deployment environment
* latency

Do not download an unnecessarily large model for a small personal application.

---

# 10. EMBEDDING PIPELINE

The pipeline should be:

```text id="q5f8ul"
Memory Created
      ↓
Validate
      ↓
Normalize
      ↓
Generate Summary
      ↓
Generate Embedding
      ↓
Store Memory
      ↓
Store Search Vector
      ↓
Ready for Retrieval
```

Do not block normal task creation if embedding generation fails.

Example:

```text id="vup5b7"
Task created
      ↓
Firestore succeeds
      ↓
Memory indexing begins asynchronously
      ↓
Embedding fails
      ↓
Task still exists
      ↓
Memory indexing retries later
```

Long-term memory must never become a single point of failure for Saarathi's core productivity functionality.

---

# 11. ASYNCHRONOUS MEMORY INDEXING

Prefer asynchronous indexing for:

* brain dumps
* large notes
* chat sessions
* historical tasks
* large documents

Architecture:

```text id="p9drfr"
Firestore
    ↓
Memory indexing job
    ↓
Text processing
    ↓
Embedding
    ↓
Supabase
```

Use the existing backend job infrastructure if available.

Do not introduce another queue system if one already exists.

---

# 12. TEXT NORMALIZATION

Before embedding:

* remove unnecessary formatting
* normalize whitespace
* preserve meaningful structure
* preserve dates
* preserve important names/entities
* preserve task context

Do not aggressively summarize away information needed for exact retrieval.

Example:

Original:

> My startup idea is to create an AI assistant that helps rural students discover NSQF-aligned courses.

Memory representation should retain the important semantic details.

---

# 13. MEMORY CHUNKING

Do not embed enormous documents as one vector.

For large content:

```text id="s5v5e5"
Document
   ↓
Chunk
   ↓
Chunk
   ↓
Chunk
   ↓
Embeddings
```

Each chunk should retain:

```text id="5z4x0n"
documentId
chunkIndex
sourceType
sourceId
```

Use chunk sizes appropriate for the embedding model.

Avoid arbitrary giant chunks.

For short notes/tasks, keep the entire item as one memory where appropriate.

---

# 14. FULL-TEXT SEARCH

Implement PostgreSQL full-text search alongside pgvector.

Use PostgreSQL's native text-search capabilities.

Create:

```text id="7p9r2y"
search_vector
```

based on:

```text id="5x2v1u"
content
summary
tags
```

Do not create a separate search engine for the initial implementation.

---

# 15. HYBRID SEARCH

Kairo must search using BOTH:

```text id="j0z4j5"
Semantic similarity
```

and:

```text id="d6x6yl"
Keyword/full-text relevance
```

Architecture:

```text id="xj5v7m"
User Query
     │
     ├──────────────┐
     │              │
     ▼              ▼
Embedding       Full Text
     │              │
     ▼              ▼
Vector Search   BM25/FTS
     │              │
     └──────┬───────┘
            ▼
       Hybrid Ranking
            │
            ▼
      Top Memories
```

---

# 16. HYBRID RANKING

Implement a transparent scoring function.

For example:

```text id="a7q0b2"
hybridScore =
    semanticWeight * semanticScore
    +
    keywordWeight * keywordScore
```

Make the weights configurable.

Do not assume the first weights are optimal.

Example configuration:

```text id="h9p0yt"
semanticWeight = 0.7
keywordWeight = 0.3
```

These values should be easy to tune.

Normalize scores before combining them if the underlying scoring systems use different ranges.

---

# 17. SEARCH FILTERS

Every memory search should support:

```text id="s8s7ac"
userId
sourceType
date range
category
tags
importance
isActive
```

Example:

> "What did I say about my startup idea three months ago?"

Search can filter:

```text id="cb3m7k"
userId = current user
date ≈ 3 months ago
```

while still using semantic similarity.

---

# 18. QUERY UNDERSTANDING

Kairo should determine whether a request requires memory retrieval.

Examples:

### Memory required

> What was that startup idea I mentioned three months ago?

### Memory probably required

> What did I say about my project?

### Memory not necessarily required

> Create a task for tomorrow.

Avoid performing expensive vector searches for every simple command.

---

# 19. MEMORY RETRIEVAL PIPELINE

Implement:

```text id="6c72au"
User Message
      ↓
Kairo Intent Detection
      ↓
Does this require memory?
      ↓
YES
      ↓
Query normalization
      ↓
Generate query embedding
      ↓
Vector search
      ↓
Full-text search
      ↓
Hybrid ranking
      ↓
Apply filters
      ↓
Remove duplicates
      ↓
Top-K memories
      ↓
Context compression
      ↓
LLM
```

---

# 20. TOP-K RETRIEVAL

Do not inject the entire memory database.

Retrieve a configurable number of candidates.

Example:

```text id="u1yn6h"
vector candidates = 20
keyword candidates = 20
final memories = 5–10
```

The exact values should be configurable.

Do not assume more context is always better.

---

# 21. MEMORY RERANKING

After hybrid retrieval, optionally rerank candidates.

Possible architecture:

```text id="4n4h4b"
Vector + FTS
      ↓
Candidate set
      ↓
Reranker
      ↓
Top relevant memories
```

Do not add an expensive reranking model unless the project actually benefits from it.

Start with hybrid scoring.

---

# 22. CONTEXT BUILDER

Create a dedicated service:

```text id="y7x1ap"
memoryContextBuilder.ts
```

Its responsibility:

1. Receive the user's query.
2. Receive retrieved memories.
3. Remove duplicates.
4. Remove irrelevant memories.
5. Respect token limits.
6. Format memories clearly.
7. Provide provenance.

Example:

```text id="u8fphm"
Relevant memory:

[Memory 1]
Source: Brain Dump
Date: 2026-05-18

User discussed an AI education startup idea...

[Memory 2]
Source: Note
Date: 2026-05-21

The startup should help students discover...
```

Kairo can then answer.

---

# 23. MEMORY PROVENANCE

Every retrieved memory should contain provenance.

Example:

```text id="8zv9v4"
sourceType
sourceId
createdAt
```

Kairo should be able to say:

> You mentioned this in a brain dump on May 18.

Do not invent dates.

If the source date is unavailable, don't claim one.

---

# 24. MEMORY CONFIDENCE

Distinguish:

```text id="i7s9r0"
retrieval relevance
```

from:

```text id="m4kqz4"
factual certainty
```

A highly similar memory is not automatically true forever.

Use metadata and validity periods.

---

# 25. MEMORY DECAY / VALIDITY

Some memories become outdated.

Example:

```text id="r3o8vo"
Current goal:
Build Saarathi
```

could later change.

Support:

```text id="d6s6bj"
validFrom
validUntil
isActive
```

When a new memory contradicts an older preference or goal:

* do not blindly delete the old memory
* mark the old memory inactive or superseded when appropriate
* preserve history where useful

Example:

```text id="x3nj9s"
Old:
User plans to build Project A.

New:
User abandoned Project A and started Project B.

```

Kairo should prefer the newer active memory.

---

# 26. MEMORY IMPORTANCE

Create an importance score.

Potential signals:

```text id="1c0v8d"
explicit user preference
long-term goal
repeated mention
project information
important deadline
temporary task
casual conversation
```

Explicit long-term preferences should receive higher importance than transient conversations.

Do not let importance override semantic relevance completely.

Use it as one ranking factor.

---

# 27. EXPLICIT MEMORY

Allow users to explicitly tell Kairo:

> Remember that I prefer studying DSA in the morning.

Kairo should create a memory with:

```text id="q1y4ck"
sourceType = user_preference
importance = high
```

Then acknowledge:

> I'll remember that.

Only persist explicit memory when the user clearly asks Kairo to remember something.

Do not automatically store every conversational statement as permanent memory.

---

# 28. MEMORY MANAGEMENT UI

Create a dedicated section:

```text id="m9y58b"
Settings
   ↓
Memory
```

Show:

```text id="8qul5x"
Kairo's Memory

Preferences
Goals
Projects
Important Notes
Recent Memories
```

Allow:

* view
* search
* edit
* delete
* deactivate

The user must have control over persistent memory.

---

# 29. "WHY DOES KAIRO KNOW THIS?"

For retrieved memories, optionally provide:

```text id="g3d8l2"
Why am I seeing this?

Kairo found this in:
Brain Dump
May 18
```

This increases transparency.

---

# 30. MEMORY DELETION

If a user deletes a memory:

1. Remove/deactivate the semantic memory.
2. Ensure it no longer appears in retrieval.
3. Remove or invalidate its embedding.
4. Preserve operational source data only if the source itself has not been deleted and policy permits re-indexing.

If the user deletes the original note/brain dump/chat:

```text id="8b3s5c"
source deleted
      ↓
memory invalidated/deleted
```

Do not leave orphaned semantic memories containing deleted content.

---

# 31. FIRESTORE ↔ SUPABASE CONSISTENCY

Firestore remains the source of truth for operational objects.

Supabase memory index is a derived representation.

Architecture:

```text id="5s04jz"
Firestore
    │
    │ source
    ▼
Memory Indexer
    │
    ▼
Supabase
```

Never treat the vector index as the primary source for tasks, reminders, or authentication.

---

# 32. MEMORY INDEXING STATUS

Track indexing state.

Example:

```text id="0ygr4r"
not_indexed
queued
processing
indexed
failed
deleted
```

This makes debugging much easier.

---

# 33. RETRY STRATEGY

If embedding generation fails:

```text id="3u8q3f"
queued
   ↓
processing
   ↓
failed
   ↓
retry
```

Use exponential backoff.

After a configurable number of failures:

```text id="x8n0oe"
failed_permanently
```

Log the reason.

Do not block the main Saarathi application.

---

# 34. EMBEDDING COST / RESOURCE MANAGEMENT

The memory architecture should remain compatible with the project's **free-first philosophy**.

Avoid generating embeddings repeatedly for unchanged content.

Store:

```text id="v3e0a6"
contentHash
embeddingModel
embeddingVersion
```

If:

```text id="p5y6az"
same contentHash
same embedding model
same embedding version
```

do not regenerate the embedding unnecessarily.

---

# 35. MODEL VERSIONING

Every embedding should record:

```text id="l8q4f0"
embeddingModel
embeddingVersion
dimension
```

If the embedding model changes:

```text id="s5o6qk"
Model v1
    ↓
Model v2
```

the memory index should support controlled re-indexing.

Do not mix vectors from incompatible dimensions in the same vector column.

---

# 36. KAIRO CONTEXT INJECTION

Integrate memory retrieval into the existing Kairo pipeline.

Current:

```text id="v5l4hs"
User Message
    ↓
Kairo
    ↓
LLM
```

New:

```text id="dyjz3p"
User Message
    ↓
Intent Detection
    ↓
Memory Retrieval
    ↓
Context Builder
    ↓
Kairo
    ↓
LLM
```

Only inject memory when relevant.

---

# 37. CONTEXT BUDGET

Do not consume the entire LLM context window with memories.

Create a configurable memory token budget.

Example:

```text id="4x8xj0"
maxMemoryTokens
```

Select memories based on:

```text id="m5q4xl"
relevance
importance
recency
diversity
```

Avoid injecting five memories that all contain the same information.

---

# 38. MEMORY DIVERSITY

If the top results are duplicates:

```text id="h7w0m2"
Memory 1
Memory 2
Memory 3
Memory 4
```

all saying essentially the same thing, keep the strongest relevant result and retrieve diverse supporting memories.

This improves context quality.

---

# 39. KAIRO RESPONSE WITH MEMORY

Example query:

> Kairo, what was that startup idea I mentioned a few months ago?

Kairo should retrieve relevant memories and answer:

> You mentioned an AI education startup that would help students discover relevant learning and skilling opportunities. You first discussed the idea in a brain dump a few months ago and later added notes about making the recommendations personalized.

If the evidence is incomplete:

> I found two related memories, but I can't confirm the exact original idea from the available history.

Do not hallucinate missing details.

---

# 40. MEMORY-AWARE TASK CREATION

Memory should also help task creation.

Example:

> Create a task for my AI project.

Kairo can retrieve the active project memory and understand which project the user means.

But if multiple projects are plausible:

> I found two active projects that could match "AI project." Which one do you mean?

Do not silently choose an ambiguous memory.

---

# 41. SEARCH EXAMPLES TO TEST

The implementation must support semantic queries such as:

```text id="p2r5cm"
"What was my startup idea?"

"What did I say about Saarathi last month?"

"What was that project I wanted to build?"

"What were my goals for this semester?"

"What did I decide about my study schedule?"

"Why did I change my workout schedule?"
```

It must also support exact keyword queries:

```text id="c7h4q0"
"Saarathi"

"Kairo"

"NSQF"

"DSA"

"Firebase"
```

Hybrid search should perform well for both semantic and exact-match queries.

---

# 42. SEARCH QUALITY TESTING

Create a fixed evaluation dataset.

Each query should have expected relevant memories.

Example:

```text id="f8h3m9"
Query:
"What was my startup idea?"

Expected:
startup brain dump
startup note

Not expected:
gym task
notification history
unrelated Kairo conversation
```

Measure:

```text id="8a6d0x"
Precision@K
Recall@K
```

where practical.

Do not optimize only for a subjective demo.

---

# 43. SECURITY

Implement:

### Supabase Row Level Security

Users must only access:

```text id="1hj5rf"
their own memories
```

Never rely exclusively on frontend filtering.

Backend queries must also enforce authenticated user identity.

Never expose:

* Supabase service-role key
* embedding provider secret
* backend credentials

to the client.

---

# 44. API DESIGN

Inspect the existing backend API structure before adding endpoints.

Potential endpoints:

```text id="0q8a3f"
POST /memory/index

POST /memory/search

GET /memory

GET /memory/:id

PATCH /memory/:id

DELETE /memory/:id
```

Use the existing authentication middleware.

Do not create a second authentication mechanism.

---

# 45. SEARCH RESPONSE

Return structured results.

Example:

```json id="q1ik4f"
{
  "query": "What was my startup idea?",
  "results": [
    {
      "memoryId": "...",
      "content": "...",
      "sourceType": "brain_dump",
      "sourceId": "...",
      "createdAt": "...",
      "semanticScore": 0.91,
      "keywordScore": 0.72,
      "hybridScore": 0.85
    }
  ]
}
```

Do not expose unnecessary internal database information.

---

# 46. OBSERVABILITY

Track memory system health.

Events:

```text id="7u3pbr"
memory_created
memory_indexing_started
memory_indexed
memory_indexing_failed
memory_retrieval_started
memory_retrieval_completed
memory_retrieval_failed
memory_deleted
```

Track latency:

```text id="n0b2a5"
embeddingLatency
vectorSearchLatency
fullTextSearchLatency
rerankingLatency
contextBuildLatency
```

Do not log private memory content unnecessarily.

---

# 47. PERFORMANCE TARGETS

The memory system should feel responsive.

Optimize:

* embedding generation
* vector indexing
* database queries
* hybrid search
* context building

Avoid performing unnecessary searches.

For a simple task command:

```text id="f7k1p4"
"Remind me tomorrow at 8 AM"
```

Kairo should not search the entire long-term memory database unless the intent requires it.

---

# 48. FAILURE HANDLING

If Supabase is unavailable:

```text id="0o9rj7"
Kairo still works
```

but without long-term memory.

Kairo should say something like:

> I can help with that, but I couldn't access your long-term memory right now.

Do NOT crash the application.

If embedding generation fails:

```text id="h3w9v5"
source data remains safe
memory indexing retries
```

If vector search fails but full-text search works:

```text id="r2c8yn"
use full-text fallback
```

If full-text search fails but vector search works:

```text id="z0k5v4"
use vector fallback
```

---

# 49. PRIVACY / USER CONTROL

Provide:

```text id="6f9s1y"
Memory Enabled
```

setting.

Users should be able to:

* disable long-term memory
* view stored memories
* delete individual memories
* clear all memories
* understand where a memory came from

If memory is disabled:

```text id="a4d2b9"
Do not index new memories.
Do not retrieve existing memories for Kairo.
```

Do not silently re-enable it.

---

# 50. TESTING

Create comprehensive tests for:

### Embeddings

* embedding generation
* correct dimensions
* content hash
* duplicate prevention
* model version

### Indexing

* new memory
* update memory
* delete memory
* retry failure
* async indexing

### Vector Search

* semantic relevance
* user isolation
* top-K
* date filtering

### Full Text

* exact keyword
* partial keyword
* phrase matching

### Hybrid Search

* semantic + keyword ranking
* score normalization
* duplicate removal
* ranking

### Context

* token budget
* memory diversity
* relevance filtering
* provenance

### Kairo

* memory retrieval when necessary
* no retrieval for simple commands
* accurate memory references
* no hallucinated memory
* ambiguous memory handling

### Security

* user A cannot access user B memories
* RLS works
* backend authentication works

### Deletion

* deleted source invalidates memory
* deleted memory no longer appears in retrieval

---

# 51. MEMORY GOLDEN TEST

Create deterministic fixtures.

Example:

```text id="v4t0qf"
Memory A:
User wants to build Saarathi.

Memory B:
User wants to build an AI education startup.

Memory C:
User completed DSA yesterday.

Memory D:
User prefers studying DSA in the morning.
```

Query:

> "What startup idea was I working on?"

Expected:

```text id="n0i3o4"
Memory B
```

Query:

> "When do I prefer studying DSA?"

Expected:

```text id="k5h3rq"
Memory D
```

Query:

> "What am I building?"

Expected:

```text id="8x0v8m"
Memory A
```

The retrieval system must distinguish these semantically related but different memories.

---

# 52. ACCEPTANCE CRITERIA

Phase 11 is complete only when:

### Embeddings

* [ ] Embedding provider abstraction exists.
* [ ] Sentence Transformer implementation exists.
* [ ] Embedding dimensions are verified.
* [ ] Embedding versioning exists.
* [ ] Content hashing prevents unnecessary regeneration.
* [ ] Async indexing works.

### Database

* [ ] Supabase PostgreSQL is configured.
* [ ] pgvector is enabled.
* [ ] Memory schema exists.
* [ ] Full-text search is configured.
* [ ] Row Level Security is implemented.
* [ ] User isolation is verified.

### Memory

* [ ] Notes can become memories.
* [ ] Brain dumps can become memories.
* [ ] Goals can become memories.
* [ ] Relevant tasks can become memories.
* [ ] Kairo conversations can become memories.
* [ ] Explicit user memories can be created.
* [ ] Memory deletion works.
* [ ] Memory editing works.
* [ ] Memory deactivation works.

### Search

* [ ] Semantic vector search works.
* [ ] Full-text search works.
* [ ] Hybrid search works.
* [ ] Score normalization works.
* [ ] Top-K retrieval works.
* [ ] Duplicate memories are removed.
* [ ] Search respects user ownership.
* [ ] Date/category filters work.

### Kairo

* [ ] Kairo can retrieve relevant memories.
* [ ] Kairo receives memory context dynamically.
* [ ] Simple requests do not trigger unnecessary memory retrieval.
* [ ] Kairo cites memory provenance where useful.
* [ ] Kairo does not fabricate memories.
* [ ] Ambiguous memories trigger clarification where appropriate.

### Reliability

* [ ] Supabase failure does not crash Saarathi.
* [ ] Embedding failure does not lose source data.
* [ ] Vector search failure falls back to full-text search.
* [ ] Full-text search failure can fall back to vector search.
* [ ] Memory indexing retries safely.

### Privacy

* [ ] Memory can be disabled.
* [ ] User can view memories.
* [ ] User can delete memories.
* [ ] User can clear memory.
* [ ] Deleted source content does not remain retrievable.

### Performance

* [ ] Memory retrieval is reasonably fast.
* [ ] Context size is bounded.
* [ ] Unnecessary searches are avoided.
* [ ] Embeddings are not regenerated unnecessarily.

---

# 53. DEFINITION OF DONE

Before declaring Phase 11 complete, run:

```text id="y3x5fc"
npm run lint:types
npm test
npm run build
```

Also run the FastAPI backend tests.

Run Supabase/database tests.

Verify:

```text id="p2f2q0"
0 TypeScript errors
0 failing frontend tests
0 failing backend tests
0 production build errors
0 database security test failures
```

Perform the complete end-to-end flow:

```text id="d2u6ml"
User creates note
       ↓
Source stored
       ↓
Memory indexing
       ↓
Embedding generated
       ↓
Supabase memory stored
       ↓
User asks Kairo about the note
       ↓
Query embedding
       ↓
Vector search
       ↓
Full-text search
       ↓
Hybrid ranking
       ↓
Relevant memory
       ↓
Context builder
       ↓
Kairo
       ↓
Accurate answer
```

Then test deletion:

```text id="5y2j8p"
Delete source note
       ↓
Memory invalidated
       ↓
Search again
       ↓
Deleted content unavailable
```

Finally test user isolation:

```text id="5m1m90"
User A
   ↓
Search

MUST NOT
   ↓
return User B memories
```

---

# 54. FINAL IMPLEMENTATION REPORT

After implementation, provide:

1. Files created
2. Files modified
3. Existing systems reused
4. Supabase schema
5. pgvector configuration
6. Embedding model/provider
7. Embedding dimensions
8. Memory indexing pipeline
9. Hybrid search architecture
10. Ranking formula
11. Memory context injection architecture
12. Memory management UI
13. Security/RLS changes
14. API endpoints
15. Failure/fallback strategy
16. Tests performed
17. Performance measurements
18. Known limitations
19. Example successful memory retrieval
20. Phase 12 readiness

Do not claim completion unless the acceptance criteria have actually been verified.

---

# FINAL ARCHITECTURAL PRINCIPLE

Saarathi's long-term memory must follow:

```text id="p9k1t3"
REMEMBER
   ↓
INDEX
   ↓
RETRIEVE
   ↓
VERIFY
   ↓
CONTEXTUALIZE
   ↓
RESPOND
```

Not:

```text id="b8q5zy"
STORE EVERYTHING
   ↓
SEND EVERYTHING TO THE LLM
```

Kairo should remember **useful things**, not everything.

Firestore remains the operational source of truth.

Supabase + pgvector becomes the semantic retrieval layer.

The embedding system creates searchable representations.

Hybrid search combines semantic understanding with exact keyword matching.

The context builder decides what Kairo actually needs to see.

Kairo communicates the retrieved information but must never invent memories.

The user always has the ability to inspect, modify, disable, and delete persistent memory.
