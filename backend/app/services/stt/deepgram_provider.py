import time
import logging
import httpx
from typing import Dict, Any
from fastapi import HTTPException
from app.core.config import settings
from app.core.resilience.circuit_breaker import circuit_registry, CircuitBreakerOpenException
from app.core.resilience.resilience_config import resilience_config
from app.services.stt.stt_interface import STTProvider

logger = logging.getLogger(__name__)

class DeepgramSTTProvider(STTProvider):
    """
    Deepgram STT Implementation with Circuit Breaker and Timeout integration.
    """
    @property
    def name(self) -> str:
        return "deepgram"

    def is_available(self) -> bool:
        cb = circuit_registry.get("deepgram")
        has_key = bool(settings.DEEPGRAM_API_KEY and settings.DEEPGRAM_API_KEY.strip())
        return has_key and cb.can_execute()

    def get_capabilities(self) -> Dict[str, Any]:
        return {
            "provider": "deepgram",
            "model": "nova-2",
            "smartFormat": True,
            "supportedFormats": ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/ogg", "audio/webm"],
            "maxDurationSeconds": 600,
        }

    async def transcribe(self, audio_data: bytes, content_type: str = "audio/wav") -> str:
        cb = circuit_registry.get("deepgram")
        if not cb.can_execute():
            health = cb.get_health()
            raise CircuitBreakerOpenException("deepgram", health.get("openTimeRemainingSeconds", 30.0))

        if not settings.DEEPGRAM_API_KEY:
            err = HTTPException(status_code=500, detail="Deepgram API Key is not configured.")
            cb.record_failure(err)
            raise err

        url = "https://api.deepgram.com/v1/listen?smart_format=true"
        headers = {
            "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
            "Content-Type": content_type
        }

        start_time = time.time()
        try:
            timeout_sec = resilience_config.TIMEOUT_STT_SECONDS
            async with httpx.AsyncClient(timeout=timeout_sec) as client:
                response = await client.post(url, headers=headers, content=audio_data)
                latency_ms = (time.time() - start_time) * 1000.0

                if response.status_code == 200:
                    data = response.json()
                    try:
                        transcript = data["results"]["channels"][0]["alternatives"][0]["transcript"]
                        cb.record_success(latency_ms)
                        return transcript
                    except (KeyError, IndexError) as e:
                        logger.error(f"Unexpected Deepgram response structure: {data}")
                        err = HTTPException(status_code=502, detail="Invalid response structure from Deepgram API")
                        cb.record_failure(err, latency_ms)
                        raise err
                else:
                    logger.error(f"Deepgram API error {response.status_code}: {response.text}")
                    err = HTTPException(status_code=response.status_code, detail=f"Deepgram API error: {response.text}")
                    cb.record_failure(err, latency_ms)
                    raise err

        except httpx.RequestError as e:
            latency_ms = (time.time() - start_time) * 1000.0
            logger.error(f"HTTP request error calling Deepgram: {str(e)}")
            cb.record_failure(e, latency_ms)
            raise e
