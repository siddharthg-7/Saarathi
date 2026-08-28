import uuid
import time
import logging
from typing import Tuple, Dict, Any, Optional, List
from fastapi import HTTPException
from app.services.stt.stt_interface import STTProvider
from app.services.stt.gemini_provider import GeminiTranscribeProvider, DEFAULT_SAARATHI_VOCABULARY
from app.services.stt.deepgram_provider import DeepgramSTTProvider
from app.services.stt.whisper_provider import WhisperSTTProvider
from app.core.resilience.circuit_breaker import circuit_registry
from app.core.resilience.backoff import retry_async
from app.core.resilience.error_classifier import classify_error, is_transient_error
from app.services.firestore_service import save_telemetry_batch

logger = logging.getLogger(__name__)

SUPPORTED_AUDIO_TYPES = {
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/m4a",
    "audio/x-m4a",
    "audio/mp4",
    "audio/ogg",
    "audio/webm",
    "audio/aac",
}

MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25MB

def validate_audio_input(
    audio_bytes: bytes,
    content_type: Optional[str] = None,
    filename: Optional[str] = None
) -> str:
    """
    Validates audio data before sending to any STT provider.
    Rejects empty, oversized, or unsupported audio cleanly without hammering external APIs.
    Returns normalized content_type.
    """
    if not audio_bytes or len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Audio payload is empty. Please provide recorded audio.")

    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Audio file exceeds maximum allowed size of {MAX_AUDIO_BYTES // (1024 * 1024)}MB."
        )

    # Normalize content type
    normalized_type = content_type.split(";")[0].strip().lower() if content_type else None

    # Guess from filename if missing or generic octet-stream
    if (not normalized_type or normalized_type == "application/octet-stream") and filename:
        ext = filename.lower().split(".")[-1]
        ext_map = {
            "wav": "audio/wav",
            "mp3": "audio/mpeg",
            "m4a": "audio/m4a",
            "ogg": "audio/ogg",
            "webm": "audio/webm",
            "aac": "audio/aac",
        }
        normalized_type = ext_map.get(ext, "audio/wav")

    if not normalized_type:
        normalized_type = "audio/wav"

    if normalized_type not in SUPPORTED_AUDIO_TYPES and not normalized_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio codec or content type: '{normalized_type}'. "
                   f"Supported formats: WAV, MP3, M4A, OGG, WebM, AAC."
        )

    return normalized_type

class ResilientSTTManager:
    """
    Unified STT Router managing speech-to-text providers with prioritized fallback:
    Priority 1: Gemini 3.5 Transcribe
    Priority 2: Deepgram Nova-2
    Priority 3: Whisper Large-v3
    """
    def __init__(self):
        self.gemini_provider: STTProvider = GeminiTranscribeProvider()
        self.deepgram_provider: STTProvider = DeepgramSTTProvider()
        self.whisper_provider: STTProvider = WhisperSTTProvider()
        # Backward-compatible references
        self.primary_provider: STTProvider = self.gemini_provider
        self.fallback_provider: STTProvider = self.whisper_provider

    async def transcribe(
        self,
        audio_data: bytes,
        content_type: str = "audio/wav",
        filename: Optional[str] = None,
        uid: Optional[str] = None,
        mode: str = "smart", # "smart" | "verbatim"
        language: Optional[str] = None,
        custom_vocabulary: Optional[List[str]] = None
    ) -> Tuple[str, str]:
        """
        Transcribes audio with multi-stage prioritized fallback:
        1. Validate audio input.
        2. Attempt Priority 1: Gemini 3.5 Transcribe.
        3. On failure/circuit open, attempt Priority 2: Deepgram Nova-2.
        4. On failure/circuit open, attempt Priority 3: Whisper Large-v3.
        Emits telemetry events (data-minimized: duration & latency, NO raw audio or transcripts).
        Returns: (transcript, provider_used)
        """
        valid_content_type = validate_audio_input(audio_data, content_type, filename)
        start_time = time.time()
        audio_duration_sec = max(1.0, len(audio_data) / 32000.0) # approximate duration
        selected_provider = "gemini_transcribe"
        fallback_used = False

        # Emit stt_started telemetry
        if uid:
            save_telemetry_batch(uid, [{
                "id": f"evt_{uuid.uuid4().hex[:10]}",
                "eventType": "stt_started",
                "mode": mode,
                "audioDurationSec": round(audio_duration_sec, 2),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }])

        # ----------------------------------------------------
        # Stage 1: Priority 1 — Gemini 3.5 Transcribe
        # ----------------------------------------------------
        gemini_cb = circuit_registry.get("gemini_transcribe")
        if gemini_cb.can_execute():
            try:
                async def _call_gemini():
                    return await self.gemini_provider.transcribe(
                        audio_data=audio_data,
                        content_type=valid_content_type,
                        mode=mode,
                        language=language,
                        custom_vocabulary=custom_vocabulary
                    )

                transcript = await retry_async(
                    _call_gemini,
                    max_retries=2,
                    operation_name="STT:Gemini3.5"
                )
                if transcript and transcript.strip():
                    latency_ms = (time.time() - start_time) * 1000.0
                    self._emit_completion_telemetry(uid, "gemini_transcribe", latency_ms, audio_duration_sec, False)
                    return transcript.strip(), "gemini_transcribe"
            except Exception as e:
                fallback_used = True
                logger.warning(f"[STT] Primary Gemini 3.5 Transcribe failed ({e}). Falling back to Deepgram.")
        else:
            fallback_used = True
            logger.info("[STT] Gemini Transcribe circuit is OPEN. Directly utilizing Deepgram fallback.")

        # ----------------------------------------------------
        # Stage 2: Priority 2 — Deepgram Nova-2
        # ----------------------------------------------------
        deepgram_cb = circuit_registry.get("deepgram")
        if deepgram_cb.can_execute():
            try:
                async def _call_deepgram():
                    return await self.deepgram_provider.transcribe(
                        audio_data=audio_data,
                        content_type=valid_content_type,
                        mode=mode,
                        language=language,
                        custom_vocabulary=custom_vocabulary
                    )

                transcript = await retry_async(
                    _call_deepgram,
                    max_retries=2,
                    operation_name="STT:Deepgram"
                )
                if transcript and transcript.strip():
                    latency_ms = (time.time() - start_time) * 1000.0
                    self._emit_completion_telemetry(uid, "deepgram", latency_ms, audio_duration_sec, True)
                    return transcript.strip(), "deepgram"
            except Exception as e:
                fallback_used = True
                logger.warning(f"[STT] Secondary Deepgram failed ({e}). Falling back to Whisper.")
        else:
            fallback_used = True
            logger.info("[STT] Deepgram circuit is OPEN. Directly utilizing Whisper fallback.")

        # ----------------------------------------------------
        # Stage 3: Priority 3 — Whisper Fallback
        # ----------------------------------------------------
        try:
            async def _call_whisper():
                return await self.whisper_provider.transcribe(
                    audio_data=audio_data,
                    content_type=valid_content_type,
                    mode=mode,
                    language=language,
                    custom_vocabulary=custom_vocabulary
                )

            transcript = await retry_async(
                _call_whisper,
                max_retries=2,
                operation_name="STT:Whisper"
            )
            latency_ms = (time.time() - start_time) * 1000.0
            self._emit_completion_telemetry(uid, "whisper", latency_ms, audio_duration_sec, True)
            return transcript.strip(), "whisper"
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000.0
            if uid:
                save_telemetry_batch(uid, [{
                    "id": f"evt_{uuid.uuid4().hex[:10]}",
                    "eventType": "stt_failed",
                    "latencyMs": round(latency_ms, 2),
                    "error": str(e),
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                }])
            logger.error(f"[STT] All STT providers failed: {e}")
            raise HTTPException(
                status_code=503,
                detail="Voice transcription is temporarily unavailable across all providers. "
                       "Your audio has been queued for later processing."
            )

    def _emit_completion_telemetry(
        self,
        uid: Optional[str],
        provider: str,
        latency_ms: float,
        audio_duration_sec: float,
        fallback_used: bool
    ):
        if not uid:
            return
        save_telemetry_batch(uid, [{
            "id": f"evt_{uuid.uuid4().hex[:10]}",
            "eventType": "stt_completed",
            "providerUsed": provider,
            "latencyMs": round(latency_ms, 2),
            "audioDurationSec": round(audio_duration_sec, 2),
            "fallbackUsed": fallback_used,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }])

stt_manager = ResilientSTTManager()
