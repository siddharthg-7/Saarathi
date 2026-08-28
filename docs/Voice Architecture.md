# Voice Architecture — Saarathi OS & Kairo AI

## 1. Overview & Objectives

Saarathi's Voice Intelligence layer is designed to provide high-accuracy, zero-friction, multilingual speech-to-text processing for voice notes, Brain Dumps, and real-time interactive conversations with Kairo. 

The architecture adheres to four core design principles:
1. **Server-Side Security**: All privileged API tokens (including `GEMINI_API_KEY`, `DEEPGRAM_API_KEY`, and `GROQ_API_KEY`) remain strictly encapsulated within the FastAPI backend. Clients authenticate exclusively via Firebase JWTs.
2. **Resilience & Fallback Hierarchy**: Provider outages are shielded by per-provider circuit breakers with prioritized fallback:
   $$\text{Gemini 3.5 Transcribe} \longrightarrow \text{Deepgram Nova-2} \longrightarrow \text{Whisper Large-v3 (Groq/Local)}$$
3. **Data Minimization & Privacy**: Spoken audio is held in memory or temporary storage only for the duration of transcription and is immediately wiped. Telemetry logs record only latency, duration, and provider metrics—never raw audio or voice transcript text.
4. **Offline First**: Voice notes recorded without network connectivity are stored locally in the offline audio queue and automatically flushed when the device reconnects.

---

## 2. Component Diagram

```text
                  Client (Web / Mobile App)
                             │
                  [Record Voice Payload]
                             │
                             ▼
         POST /v1/brain-dump/audio  OR  WS /v1/brain-dump/ws
                             │
                             ▼
                FastAPI Authentication & Rate Limiter
                             │
                             ▼
                    STTRouter / ResilientSTTManager
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
     [Priority 1]       [Priority 2]       [Priority 3]
  Gemini 3.5 Transcribe   Deepgram Nova-2    Whisper Large-v3
  (gemini-2.5-flash /     (api.deepgram.com) (Groq / Local)
   gemini-3.5-transcribe)
  [Circuit Breaker]      [Circuit Breaker]  [Circuit Breaker]
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ▼
                     Clean Transcript
               (Smart Cleaned / Verbatim)
                             │
                             ▼
                 LLM Task Extraction Pipeline
            (Structured JSON Schema + Validation)
                             │
                             ▼
                   Firestore Task Sync & Checkpoint
```

---

## 3. Provider Abstraction (`STTProvider`)

The unified interface is defined in `backend/app/services/stt/stt_interface.py`:

```python
class STTProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider identifier ('gemini_transcribe', 'deepgram', 'whisper')."""
        pass

    @abstractmethod
    async def transcribe(
        self,
        audio_data: bytes,
        content_type: str = "audio/wav",
        mode: str = "smart", # "smart" | "verbatim"
        language: Optional[str] = None,
        custom_vocabulary: Optional[List[str]] = None
    ) -> str:
        """Transcribes raw audio bytes into text with custom vocabulary support."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the provider API key is present and circuit is CLOSED/HALF-OPEN."""
        pass

    @abstractmethod
    def get_capabilities(self) -> Dict[str, Any]:
        """Returns provider capabilities and supported codecs."""
        pass
```

---

## 4. Transcription Modes

### A. Smart Transcription Mode (`mode="smart"`)
Optimized for Brain Dumps and cognitive task extraction:
- **Verbal Filler Reduction**: Filters out speech hesitations (`"um"`, `"uh"`, `"like"`, `"you know"`).
- **Speech Self-Correction Resolution**: Smooths verbal revisions (`"Tomorrow at 4 PM, no wait, 5 PM"` $\rightarrow$ `"Tomorrow at 5 PM"`).
- **Date & Number Normalization**: Converts spoken numbers and dates (`"twenty-eighth of August"` $\rightarrow$ `"August 28th"`).
- **Domain Vocabulary Preservation**: Accurately recognizes technical terms:
  `Saarathi`, `Kairo`, `Firebase`, `Firestore`, `Supabase`, `pgvector`, `FastAPI`, `React Native`, `Expo`, `Vitest`, `Pytest`.
- **Multilingual / Code-Switching**: Accurately transcribes Hinglish and multilingual speech without forced translation.

### B. Verbatim Transcription Mode (`mode="verbatim"`)
Used when exact legal or verbatim records of spoken utterances are needed:
- Preserves every word, pause, repetition, and verbal filler without normalization.

---

## 5. Live Audio Streaming (`GeminiLiveSTTProvider`)

Real-time audio streaming is supported over WebSockets:
- Client streams chunked audio buffers (`audio/webm` or `pcm_16000`).
- Server yields interim heartbeat/status signals and emits final transcripts upon buffer completion.
- API keys never leave the server.

---

## 6. Offline Audio Queue

When the device is disconnected (`navigator.onLine === false`):
1. Voice recording is captured into a local blob and registered in `OfflineAudioQueue` with metadata:
   $$\{ \text{id, userId, localFilePath, createdAt, status: 'queued', retryCount, checksum} \}$$
2. The UI immediately displays:
   > `"Saved locally. Kairo will process your voice note when your connection returns."`
3. Upon network restoration (`networkMonitor.subscribe`), queued jobs automatically process with exponential backoff retry.

---

## 7. Telemetry & Observability

To uphold zero-knowledge privacy guarantees, telemetry events are strictly metadata-only:
- `stt_started`: Logged with `audioDurationSec` and `mode`.
- `stt_completed`: Logged with `providerUsed`, `latencyMs`, `audioDurationSec`, and `fallbackUsed` (boolean).
- `stt_failed`: Logged with `latencyMs` and classified error code.
- **NEVER** logs raw audio binaries or transcript text in observability stores.

---

## 8. Verification & Test Suite

The voice intelligence subsystem is covered by automated test suites:
- [`backend/tests/test_voice_gemini_transcribe.py`](file:///c:/project-self-1/Saarathi/backend/tests/test_voice_gemini_transcribe.py): Provider unit tests, rate limiting, timeouts, custom vocabulary, and circuit breaker tripping.
- [`backend/tests/test_voice_brain_dump_regression.py`](file:///c:/project-self-1/Saarathi/backend/tests/test_voice_brain_dump_regression.py): End-to-end task extraction with speech self-corrections and multilingual code-switching.
- [`backend/tests/test_resilience_stt.py`](file:///c:/project-self-1/Saarathi/backend/tests/test_resilience_stt.py): Audio validation, multi-stage fallback testing (`Gemini -> Deepgram -> Whisper`).
