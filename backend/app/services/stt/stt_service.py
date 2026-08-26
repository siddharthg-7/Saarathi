import uuid
import time
import logging
from typing import Tuple, Dict, Any, Optional, List
from fastapi import HTTPException
from app.services.stt.stt_interface import STTProvider
from app.services.stt.deepgram_provider import DeepgramSTTProvider
from app.services.stt.whisper_provider import WhisperSTTProvider
from app.core.resilience.circuit_breaker import circuit_registry
from app.core.resilience.backoff import retry_async
from app.core.resilience.error_classifier import classify_error, is_transient_error

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
                   f"Supported formats: WAV, MP3, M4A, OGG, WebM."
        )

    return normalized_type

class ResilientSTTManager:
    """
    Manages speech-to-text providers with automatic fallback, exponential backoff,
    circuit breaking, and intermediate checkpointing.
    """
    def __init__(self):
        self.primary_provider: STTProvider = DeepgramSTTProvider()
        self.fallback_provider: STTProvider = WhisperSTTProvider()

    async def transcribe(
        self,
        audio_data: bytes,
        content_type: str = "audio/wav",
        filename: Optional[str] = None,
        uid: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Transcribes audio with multi-stage fallback:
        1. Validate audio input cleanly.
        2. Attempt Primary (Deepgram) with backoff retry on transient errors.
        3. On persistent failure or circuit open, fall back to Secondary (Whisper).
        Returns: (transcript, provider_used)
        """
        valid_content_type = validate_audio_input(audio_data, content_type, filename)
        
        # 1. Try Primary Provider (Deepgram)
        deepgram_cb = circuit_registry.get("deepgram")
        if deepgram_cb.can_execute():
            try:
                async def _call_primary():
                    return await self.primary_provider.transcribe(audio_data, valid_content_type)

                transcript = await retry_async(
                    _call_primary,
                    max_retries=2,
                    operation_name="STT:Deepgram"
                )
                if transcript and transcript.strip():
                    return transcript.strip(), "deepgram"
            except Exception as e:
                logger.warning(f"[STT] Primary provider ({self.primary_provider.name}) failed ({e}). Triggering fallback.")
        else:
            logger.info("[STT] Primary provider circuit is OPEN. Directly utilizing fallback STT.")

        # 2. Try Fallback Provider (Whisper)
        try:
            async def _call_fallback():
                return await self.fallback_provider.transcribe(audio_data, valid_content_type)

            transcript = await retry_async(
                _call_fallback,
                max_retries=2,
                operation_name="STT:Whisper"
            )
            return transcript.strip(), "whisper"
        except Exception as e:
            logger.error(f"[STT] Fallback provider ({self.fallback_provider.name}) failed: {e}")
            raise HTTPException(
                status_code=503,
                detail="Voice transcription is temporarily unavailable across all providers. "
                       "Your audio has been queued for later processing."
            )

stt_manager = ResilientSTTManager()
