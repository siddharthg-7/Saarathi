# Saarathi Voice Intelligence Upgrade
# Gemini 3.5 Transcribe Integration

You are continuing development of Saarathi and its AI assistant Kairo.

Do NOT replace the existing voice architecture blindly.

First inspect the existing:

- Deepgram integration
- Whisper fallback
- audio recording
- Brain Dump flow
- Kairo voice flow
- Phase 12 resilience architecture
- Phase 15 testing architecture
- offline audio queue
- telemetry
- WebSocket implementation

The goal is to introduce Gemini 3.5 Transcribe as a first-class STT provider while preserving the existing fallback architecture.

==================================================
1. TARGET ARCHITECTURE
==================================================

Implement a provider abstraction:

STT Provider Interface
        │
        ├── Gemini Transcribe
        ├── Gemini Transcribe Live
        ├── Deepgram
        └── Whisper fallback

The rest of Saarathi must NOT depend directly on a specific STT provider.

Example conceptual interface:

transcribeAudio()
startLiveTranscription()
stopLiveTranscription()
isAvailable()
getCapabilities()

Use the actual project's conventions rather than blindly copying this API.

==================================================
2. GEMINI 3.5 TRANSCRIBE
==================================================

Add support for:

model:

gemini-3.5-transcribe

Use the official Google GenAI SDK/API appropriate for the existing backend architecture.

IMPORTANT:

The Gemini API key must NEVER be exposed in:

React
React Native
Expo client code
browser JavaScript

All privileged Gemini API calls must go through the backend.

==================================================
3. BRAIN DUMP
==================================================

Change Brain Dump to prefer:

Gemini 3.5 Transcribe

Pipeline:

Audio recording
      ↓
upload/queue
      ↓
FastAPI
      ↓
Gemini 3.5 Transcribe
      ↓
clean transcript
      ↓
Kairo task extraction
      ↓
schema validation
      ↓
Firestore
      ↓
analytics telemetry

The UI must immediately show:

"Kairo is processing your brain dump..."

Do not block the UI.

==================================================
4. SMART TRANSCRIPTION
==================================================

Use Smart transcription for Brain Dump where appropriate.

The transcript should:

- remove unnecessary filler words
- resolve spoken corrections
- format spoken lists
- normalize dates
- normalize numbers
- preserve actual user intent

IMPORTANT:

Smart transcription must NOT invent tasks.

If the user says:

"I need to maybe call Rahul"

do not transform uncertainty into a guaranteed task unless the downstream task extraction logic explicitly decides this.

==================================================
5. VERBATIM MODE
==================================================

Support Verbatim mode where exact transcription is required.

Use it when:

- word timestamps are required
- speaker diarization is required
- raw transcript preservation is required

Do not use Smart mode when the required API configuration is incompatible with those features.

==================================================
6. CUSTOM VOCABULARY
==================================================

Create a configurable Saarathi vocabulary.

Potential terms:

Saarathi
Kairo
Firebase
Firestore
Supabase
pgvector
FastAPI
React Native
Expo
Groq
Gemini
Deepgram
Whisper

Do not hardcode an unnecessarily large vocabulary.

Allow future user/project-specific vocabulary where appropriate.

==================================================
7. LANGUAGE DETECTION
==================================================

Support automatic language detection.

Do not force English globally.

Support multilingual and code-switched speech.

The application should preserve the detected transcript language.

Do not automatically translate the user's speech unless explicitly requested.

==================================================
8. LIVE TRANSCRIPTION
==================================================

Add Gemini:

gemini-3.5-transcribe-live

for real-time voice interaction where appropriate.

Use WebSockets.

Architecture:

Microphone
   ↓
Audio stream
   ↓
Backend / secure Live API connection
   ↓
Gemini Transcribe Live
   ↓
Interim transcript
   ↓
Final transcript
   ↓
Kairo

Do not send Gemini API credentials to the client.

Use short-lived/appropriate authentication mechanisms supported by the API architecture.

==================================================
9. STT ROUTER
==================================================

Implement a centralized STT routing layer.

Example:

Brain Dump:
Gemini Transcribe
   ↓ failure
Deepgram
   ↓ failure
Whisper

Live Kairo:
Gemini Transcribe Live
   ↓ failure
existing supported live provider
   ↓ failure
graceful fallback

Do not invent unsupported fallback behavior.

==================================================
10. CIRCUIT BREAKER
==================================================

Integrate with Phase 12.

Gemini STT failures should trigger the existing circuit breaker.

Handle:

timeout
429/rate limit
5xx
network failure
invalid response

Do not retry indefinitely.

Use exponential backoff with jitter where appropriate.

==================================================
11. OFFLINE AUDIO
==================================================

If the device is offline:

record audio locally.

Store a queue item:

audio ID
local path
createdAt
duration
status
retry count

When connectivity returns:

upload/process automatically.

Never silently delete an unprocessed recording.

After successful processing:

clean up temporary audio according to the existing retention policy.

==================================================
12. AUDIO PRIVACY
==================================================

Do not permanently retain raw audio unless the user explicitly chooses to.

Prefer:

record
→ process
→ transcript
→ delete temporary audio

Document retention behavior.

Do not log raw audio contents.

Do not log sensitive transcripts unnecessarily.

==================================================
13. TELEMETRY
==================================================

Integrate with Phase 8.

Track:

stt_started
stt_completed
stt_failed
stt_provider_selected
stt_fallback_used
stt_latency
audio_duration
language_detected

Do NOT store:

raw audio
full transcript

inside telemetry unless explicitly required.

==================================================
14. AI PIPELINE
==================================================

Maintain separation:

STT:
audio → transcript

Kairo:
transcript → intent/tasks/actions

Do not make the STT provider responsible for task creation.

Pipeline:

Audio
 ↓
STT
 ↓
Transcript
 ↓
Kairo
 ↓
Structured output
 ↓
Validation
 ↓
Firestore

==================================================
15. STRUCTURED OUTPUT SAFETY
==================================================

Kairo's extracted tasks must pass:

schema validation
+
business validation

before Firestore mutation.

Never allow raw LLM output to directly create arbitrary Firestore documents.

==================================================
16. PROVIDER OBSERVABILITY
==================================================

Expose internal metrics:

provider
latency
success
failure
fallback
audio duration

Do not expose internal provider details unnecessarily to normal users.

==================================================
17. TESTING
==================================================

Add tests for:

Gemini transcription success
Gemini timeout
Gemini rate limit
Gemini malformed response
Deepgram fallback
Whisper fallback
offline queue
queue retry
duplicate processing prevention
language detection
smart transcription
verbatim transcription
custom vocabulary
live transcription
WebSocket disconnect
WebSocket reconnect

==================================================
18. BRAIN DUMP REGRESSION TESTS
==================================================

Create examples containing:

- filler words
- self-corrections
- dates
- times
- multiple tasks
- priorities
- multilingual speech
- technical vocabulary
- ambiguous statements

Verify the transcript and Kairo extraction.

Do not require exact textual equality where transcription naturally varies.

Validate semantic correctness.

==================================================
19. PERFORMANCE
==================================================

Measure:

recording → upload
upload → STT start
STT latency
STT → transcript
transcript → Kairo
total Brain Dump latency

Do not claim latency improvements without measurements.

==================================================
20. FREE-FIRST
==================================================

Use Google's available free tier during development where applicable.

Do not introduce paid infrastructure.

Do not claim the system is permanently free.

Document:

free-tier assumptions
possible paid usage
rate limits
provider fallback

==================================================
21. DOCUMENTATION
==================================================

Create/update:

docs/Voice Architecture.md

Include:

STT provider architecture
Gemini integration
Deepgram fallback
Whisper fallback
Live transcription
offline audio
privacy
telemetry
failure handling

Update:

docs/ROADMAP.md

Add:

Phase 12.5 — Unified Voice Intelligence

==================================================
22. PHASE 15 INTEGRATION
==================================================

Add voice tests to Phase 15.

Include:

unit
integration
E2E
failure
offline
performance

Do not call the feature complete until the critical voice tests pass.

==================================================
23. FINAL VALIDATION
==================================================

Run:

npm run lint:types
npm test
npm run build

Backend:

pytest

Run the relevant voice integration tests.

Report exact results.

==================================================
24. FINAL REPORT
==================================================

Return:

1. Existing voice architecture
2. Gemini integration
3. Provider routing
4. Deepgram fallback
5. Whisper fallback
6. Live transcription
7. Brain Dump changes
8. Offline queue
9. Privacy behavior
10. Telemetry
11. Tests
12. Performance measurements
13. Environment variables
14. Known limitations
15. Remaining work

DO NOT fabricate results.

DO NOT expose API keys.

DO NOT remove working providers merely because Gemini has been added.

The final architecture must remain:

Reliable
Offline-friendly
Secure
Free-first
Cross-platform
Provider-independent
Testable