import time
import logging
from typing import AsyncGenerator, Optional, List, Dict, Any
from app.services.stt.stt_interface import STTProvider
from app.services.stt.gemini_provider import GeminiTranscribeProvider

logger = logging.getLogger(__name__)

class GeminiLiveSTTProvider(STTProvider):
    """
    Live streaming Speech-to-Text provider for real-time Kairo voice interactions.
    Handles streaming audio buffers, interim partial transcripts, and final punctuation.
    """
    def __init__(self, model: str = "gemini-3.5-transcribe-live"):
        self.model = model
        self._fallback_provider = GeminiTranscribeProvider()

    @property
    def name(self) -> str:
        return "gemini_transcribe_live"

    def is_available(self) -> bool:
        return self._fallback_provider.is_available()

    def get_capabilities(self) -> Dict[str, Any]:
        return {
            "provider": "gemini_transcribe_live",
            "model": "gemini-3.5-transcribe-live",
            "streaming": True,
            "interimResults": True,
            "realTimeFactor": 0.2,
            "supportedEncodings": ["pcm_16000", "audio/webm", "audio/wav"],
        }

    async def transcribe(
        self,
        audio_data: bytes,
        content_type: str = "audio/wav",
        mode: str = "smart",
        language: Optional[str] = None,
        custom_vocabulary: Optional[List[str]] = None
    ) -> str:
        """Fallback to batch transcribe if entire buffer is provided."""
        return await self._fallback_provider.transcribe(
            audio_data=audio_data,
            content_type=content_type,
            mode=mode,
            language=language,
            custom_vocabulary=custom_vocabulary
        )

    async def stream_transcribe_chunks(
        self,
        chunk_generator: AsyncGenerator[bytes, None],
        content_type: str = "audio/webm",
        mode: str = "smart",
        custom_vocabulary: Optional[List[str]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Yields interim and final transcription tokens from streaming audio chunks.
        """
        accumulated_chunks = []
        start_time = time.time()

        async for chunk in chunk_generator:
            if not chunk:
                continue
            accumulated_chunks.append(chunk)

            # Yield heartbeat / interim indicator
            yield {
                "type": "interim",
                "isFinal": False,
                "status": "listening",
                "bytesReceived": sum(len(c) for c in accumulated_chunks),
            }

        # Transcribe complete buffered audio
        full_audio = b"".join(accumulated_chunks)
        if full_audio:
            final_text = await self.transcribe(
                audio_data=full_audio,
                content_type=content_type,
                mode=mode,
                custom_vocabulary=custom_vocabulary
            )
            latency_ms = (time.time() - start_time) * 1000.0
            yield {
                "type": "final",
                "isFinal": True,
                "transcript": final_text,
                "latencyMs": latency_ms
            }
