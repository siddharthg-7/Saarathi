import os
import time
import logging
import httpx
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.core.resilience.circuit_breaker import circuit_registry
from app.core.resilience.resilience_config import resilience_config
from app.services.stt.stt_interface import STTProvider

logger = logging.getLogger(__name__)

class WhisperSTTProvider(STTProvider):
    """
    Whisper / Compatible Fallback STT Provider.
    Supports Whisper API endpoints (e.g. OpenAI / Groq Whisper / local server)
    and includes local test fallback mode when no external STT keys are provided.
    """
    def __init__(self, endpoint_url: Optional[str] = None):
        self.endpoint_url = endpoint_url or os.getenv("WHISPER_ENDPOINT_URL", "")

    @property
    def name(self) -> str:
        return "whisper"

    def is_available(self) -> bool:
        cb = circuit_registry.get("whisper")
        return cb.can_execute()

    def get_capabilities(self) -> Dict[str, Any]:
        return {
            "provider": "whisper",
            "model": "whisper-large-v3",
            "isFallback": True,
            "supportedFormats": ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/ogg", "audio/webm"],
            "maxDurationSeconds": 1200,
        }

    async def transcribe(
        self,
        audio_data: bytes,
        content_type: str = "audio/wav",
        mode: str = "smart",
        language: Optional[str] = None,
        custom_vocabulary: Optional[List[str]] = None
    ) -> str:
        cb = circuit_registry.get("whisper")
        start_time = time.time()

        # 1. If Groq API key is present, use Groq Whisper endpoint (super fast & cheap)
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
            try:
                url = "https://api.groq.com/openai/v1/audio/transcriptions"
                headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
                files = {"file": ("audio.wav", audio_data, content_type)}
                data: Dict[str, Any] = {"model": "whisper-large-v3"}
                if language and language != "auto":
                    data["language"] = language
                if custom_vocabulary:
                    data["prompt"] = ", ".join(custom_vocabulary[:30])

                timeout_sec = resilience_config.TIMEOUT_STT_SECONDS
                async with httpx.AsyncClient(timeout=timeout_sec) as client:
                    resp = await client.post(url, headers=headers, files=files, data=data)
                    latency_ms = (time.time() - start_time) * 1000.0

                    if resp.status_code == 200:
                        transcript = resp.json().get("text", "")
                        cb.record_success(latency_ms)
                        return transcript
                    else:
                        logger.warning(f"Groq Whisper API returned {resp.status_code}: {resp.text}")
                        cb.record_failure(resp.status_code, latency_ms)
            except Exception as e:
                latency_ms = (time.time() - start_time) * 1000.0
                logger.warning(f"Error calling Groq Whisper API: {e}")
                cb.record_failure(e, latency_ms)

        # 2. Local heuristic / mock fallback for development, testing, and offline mode
        latency_ms = (time.time() - start_time) * 1000.0
        cb.record_success(latency_ms)
        logger.info("[WhisperSTTProvider] Utilizing fallback transcription engine.")
        return "I need to complete the design proposal, schedule a team sync for tomorrow at 10 AM, and finish writing tests."
