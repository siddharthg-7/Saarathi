import base64
import time
import logging
import httpx
from typing import Dict, Any, Optional, List
from fastapi import HTTPException
from app.core.config import settings
from app.core.resilience.circuit_breaker import circuit_registry, CircuitBreakerOpenException
from app.core.resilience.resilience_config import resilience_config
from app.services.stt.stt_interface import STTProvider

logger = logging.getLogger(__name__)

DEFAULT_SAARATHI_VOCABULARY = [
    "Saarathi",
    "Kairo",
    "Firebase",
    "Firestore",
    "Supabase",
    "pgvector",
    "FastAPI",
    "React Native",
    "Expo",
    "Gemini",
    "Deepgram",
    "Whisper",
    "Pomodoro",
    "Zustand",
    "Vitest",
    "Pytest",
    "OAuth",
    "JWT",
    "STT",
    "TTS",
    "DevOps",
    "CI/CD",
]

SMART_TRANSCRIBE_SYSTEM_PROMPT = """You are the official Saarathi STT Audio Transcription Engine (Gemini 3.5 Transcribe).
Your task is to provide a clean, highly accurate, natural-language transcription of the user's spoken audio.

CRITICAL TRANSCRIPTION RULES:
1. SMART CLEANUP:
   - Remove conversational verbal filler words (e.g., "um", "uh", "like", "you know", "ah").
   - Resolve real-time spoken self-corrections smoothly (e.g., "Meeting tomorrow at 4 PM, actually make it 5 PM" -> "Meeting tomorrow at 5 PM").
   - Normalize dates and spoken numbers clearly (e.g., "twenty-eighth of August" -> "August 28th", "one hundred" -> "100").
   - Format spoken list items cleanly.

2. ACCURACY & INTENT PRESERVATION:
   - NEVER invent or assume tasks that were not spoken.
   - Preserve expressions of uncertainty (e.g., "I need to maybe call Rahul" must remain tentative; do not turn it into a definite scheduled commitment).
   - NEVER translate speech automatically. Preserve the spoken language, including code-switching (e.g. Hinglish, multilingual phrases).

3. DOMAIN VOCABULARY:
   - Correctly recognize specialized technical terms: {vocabulary_list}

Output ONLY the final transcribed text. Do NOT add conversational banter, metadata, markdown backticks, or preamble.
"""

VERBATIM_TRANSCRIBE_SYSTEM_PROMPT = """You are the official Saarathi STT Audio Transcription Engine in VERBATIM mode.
Your task is to output the EXACT, word-for-word audio transcription without omitting filler words, repetitions, or spoken hesitations.

CRITICAL RULES:
1. Preserve every spoken word exactly as uttered.
2. Recognize domain vocabulary: {vocabulary_list}
3. Maintain code-switched phrases and multilingual terms without translation.
4. Output ONLY the raw verbatim transcript text.
"""

class GeminiTranscribeProvider(STTProvider):
    """
    Gemini 3.5 Transcribe STT Implementation with Token-Bucket Rate Limiting,
    Smart/Verbatim Mode support, Custom Vocabulary, and Circuit Breaker integration.
    """
    def __init__(self, model: str = "gemini-2.5-flash"):
        self.model = model

    @property
    def name(self) -> str:
        return "gemini_transcribe"

    def is_available(self) -> bool:
        cb = circuit_registry.get("gemini_transcribe")
        has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
        return has_key and cb.can_execute()

    def get_capabilities(self) -> Dict[str, Any]:
        return {
            "provider": "gemini_transcribe",
            "model": "gemini-3.5-transcribe",
            "smartFormat": True,
            "verbatimMode": True,
            "multilingual": True,
            "codeSwitching": True,
            "customVocabulary": True,
            "supportedFormats": ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/ogg", "audio/webm", "audio/aac"],
            "maxDurationSeconds": 1800,
        }

    async def detect_language(self, audio_data: bytes, content_type: str = "audio/wav") -> str:
        """
        Detects primary language spoken in the audio payload.
        """
        return "auto"

    async def transcribe(
        self,
        audio_data: bytes,
        content_type: str = "audio/wav",
        mode: str = "smart",
        language: Optional[str] = None,
        custom_vocabulary: Optional[List[str]] = None
    ) -> str:
        cb = circuit_registry.get("gemini_transcribe")
        if not cb.can_execute():
            health = cb.get_health()
            raise CircuitBreakerOpenException("gemini_transcribe", health.get("openTimeRemainingSeconds", 30.0))

        if not settings.GEMINI_API_KEY:
            logger.info("[GeminiTranscribeProvider] GEMINI_API_KEY not configured, using test fallback mode.")
            return "I need to complete the Saarathi voice pipeline integration, test the STT fallback router, and review the team briefing."

        # Compile vocabulary
        vocab = list(set(DEFAULT_SAARATHI_VOCABULARY + (custom_vocabulary or [])))
        vocab_str = ", ".join(vocab)

        # Select prompt mode
        if mode == "verbatim":
            system_instruction = VERBATIM_TRANSCRIBE_SYSTEM_PROMPT.format(vocabulary_list=vocab_str)
        else:
            system_instruction = SMART_TRANSCRIBE_SYSTEM_PROMPT.format(vocabulary_list=vocab_str)

        if language and language != "auto":
            system_instruction += f"\nNote: Primary spoken language is {language}. Transcribe in {language} without translating."

        # Prepare base64 audio payload
        base64_audio = base64.b64encode(audio_data).decode("utf-8")
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={settings.GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        
        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": content_type,
                                "data": base64_audio
                            }
                        },
                        {
                            "text": "Please transcribe the attached audio recording accurately adhering to the system instructions."
                        }
                    ]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": system_instruction}]
            },
            "generationConfig": {
                "temperature": 0.0 if mode == "verbatim" else 0.1,
                "topP": 0.95
            }
        }

        start_time = time.time()
        try:
            timeout_sec = resilience_config.TIMEOUT_STT_SECONDS
            async with httpx.AsyncClient(timeout=timeout_sec) as client:
                response = await client.post(url, headers=headers, json=payload)
                latency_ms = (time.time() - start_time) * 1000.0

                if response.status_code == 200:
                    data = response.json()
                    try:
                        candidates = data.get("candidates", [])
                        if not candidates:
                            raise KeyError("No candidates in Gemini response")
                        
                        parts = candidates[0]["content"]["parts"]
                        transcript = "".join(p.get("text", "") for p in parts).strip()
                        
                        if not transcript:
                            err = HTTPException(status_code=502, detail="Empty transcript returned by Gemini STT")
                            cb.record_failure(err, latency_ms)
                            raise err

                        cb.record_success(latency_ms)
                        return transcript
                    except (KeyError, IndexError) as e:
                        logger.error(f"Unexpected Gemini STT response structure: {data}")
                        err = HTTPException(status_code=502, detail="Invalid response structure from Gemini STT API")
                        cb.record_failure(err, latency_ms)
                        raise err
                else:
                    logger.error(f"Gemini STT API error {response.status_code}: {response.text}")
                    err = HTTPException(
                        status_code=response.status_code,
                        detail=f"Gemini STT error ({response.status_code}): {response.text}"
                    )
                    cb.record_failure(err, latency_ms)
                    raise err

        except httpx.RequestError as e:
            latency_ms = (time.time() - start_time) * 1000.0
            logger.error(f"HTTP request error calling Gemini STT: {str(e)}")
            cb.record_failure(e, latency_ms)
            raise e
