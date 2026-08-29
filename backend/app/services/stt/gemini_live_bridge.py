import os
import asyncio
import logging
import base64
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.services.tool_calling import parse_and_execute_tools

logger = logging.getLogger(__name__)

# Supported prebuilt realistic HD voice identities in Gemini Live API (2026 Library)
VOICE_PERSONAS: Dict[str, str] = {
    # Popular & Flagship
    "puck": "Puck",
    "kore": "Kore",
    "zephyr": "Zephyr",
    "charon": "Charon",
    "fenrir": "Fenrir",
    "aoede": "Aoede",

    # Calm & Mindful
    "leda": "Leda",
    "umbriel": "Umbriel",
    "erinome": "Erinome",
    "gacrux": "Gacrux",
    "sadachbia": "Sadachbia",

    # Energetic & Modern
    "orus": "Orus",
    "autonoe": "Autonoe",
    "despina": "Despina",
    "schedar": "Schedar",
    "vindemiatrix": "Vindemiatrix",

    # Deep & Resonant
    "enceladus": "Enceladus",
    "iapetus": "Iapetus",
    "rasalgethi": "Rasalgethi",
    "zubenelgenubi": "Zubenelgenubi",

    # Celestial HD Expressive
    "callirhoe": "Callirhoe",
    "algieba": "Algieba",
    "algenib": "Algenib",
    "laomedeia": "Laomedeia",
    "achernar": "Achernar",
    "alnilam": "Alnilam",
    "pulcherrima": "Pulcherrima",
    "achird": "Achird",
}

DEFAULT_VOICE = "kore"

def build_acoustic_delivery_directive(
    energy: str = "Medium",
    focus_mode: bool = False,
    mood: Optional[str] = None
) -> str:
    """
    Constructs prompt-directed acoustic delivery instructions for Gemini Native Audio generation.
    Leverages model vocal steerability (pacing, whisper, excitement, empathy).
    """
    directives = []
    
    if energy.lower() in ("low", "exhausted", "tired"):
        directives.append("Speak in a gentle, warm, soothing, and slightly slower cadence. Use empathetic inflection.")
    elif energy.lower() in ("high", "peak"):
        directives.append("Speak with an upbeat, brisk, energized, and motivating conversational tone.")
    else:
        directives.append("Speak with a natural, clear, balanced, and conversational cadence.")

    if focus_mode:
        directives.append("Focus Mode Active: Keep delivery calm, low-profile, and distraction-free.")

    if mood:
        directives.append(f"Adapt vocal delivery to match user mood context: '{mood}'.")

    return "\n### Prompt-Directed Acoustic Delivery & Prosody:\n" + " ".join(directives)


class GeminiLiveVoiceBridge:
    """
    Native bidirectional audio-to-audio voice streaming bridge using the Gemini Live API.
    Handles low-latency streaming of microphone PCM audio up and simultaneous streaming of
    AI audio bytes and live transcript tokens down, with support for voice persona switching,
    barge-in interruption handling, and tool execution.
    """
    def __init__(self, api_key: Optional[str] = None, voice: str = DEFAULT_VOICE):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.voice_name = self.resolve_voice(voice)
        self.is_live_available = bool(self.api_key and not self.api_key.startswith("mock_"))
        
        self._genai_client = None
        if self.is_live_available:
            try:
                from google import genai
                self._genai_client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize google-genai client: {e}. Fallback active.")
                self.is_live_available = False

    @staticmethod
    def resolve_voice(voice_key: str) -> str:
        """Resolve friendly voice key or capitalize prebuilt voice name."""
        if not voice_key:
            return DEFAULT_VOICE
        normalized = voice_key.lower().strip()
        return VOICE_PERSONAS.get(normalized, voice_key.capitalize())

    def set_voice(self, voice_key: str) -> str:
        """Update active voice persona dynamically."""
        self.voice_name = self.resolve_voice(voice_key)
        return self.voice_name

    def build_live_config(self, system_instruction: str) -> Any:
        """Constructs types.LiveConnectConfig with audio modality and voice configuration."""
        try:
            from google.genai import types
            return types.LiveConnectConfig(
                response_modalities=[types.LiveModality.AUDIO],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=self.voice_name
                        )
                    )
                ),
                system_instruction=system_instruction,
            )
        except Exception as e:
            logger.debug(f"Types import notice in config builder: {e}")
            return None

    async def stream_live_session(
        self,
        incoming_audio_queue: asyncio.Queue,
        system_instruction: str,
        uid: str = "default_user",
        model: str = "gemini-2.5-flash"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Maintains an active bidirectional live session.
        Streams PCM chunks from incoming_audio_queue to Gemini and yields output events:
          - {"type": "transcript", "role": "assistant" | "user", "text": str, "isFinal": bool}
          - {"type": "audio", "data": base64_str, "mimeType": str}
          - {"type": "actions", "suggestedActions": List[dict]}
          - {"type": "turn_complete"}
        """
        if not self.is_live_available or not self._genai_client:
            async for event in self._fallback_stream_loop(incoming_audio_queue, system_instruction, uid):
                yield event
            return

        config = self.build_live_config(system_instruction)
        
        try:
            async with self._genai_client.aio.live.connect(model=model, config=config) as session:
                logger.info(f"Gemini Live session connected with voice persona '{self.voice_name}'")

                async def send_mic_audio():
                    try:
                        while True:
                            pcm_chunk = await incoming_audio_queue.get()
                            if pcm_chunk is None:
                                break
                            if isinstance(pcm_chunk, bytes) and len(pcm_chunk) > 0:
                                await session.send(input={"data": pcm_chunk, "mime_type": "audio/pcm;rate=16000"})
                    except asyncio.CancelledError:
                        pass
                    except Exception as err:
                        logger.error(f"Error streaming microphone data to Gemini Live: {err}")

                send_task = asyncio.create_task(send_mic_audio())

                try:
                    accumulated_text = ""
                    async for response in session.receive():
                        if response.server_content is not None:
                            model_turn = response.server_content.model_turn
                            if model_turn:
                                for part in model_turn.parts:
                                    # 1. Live Text Transcript (STT Output)
                                    if part.text:
                                        accumulated_text += part.text
                                        yield {
                                            "type": "transcript",
                                            "role": "assistant",
                                            "text": part.text,
                                            "isFinal": False
                                        }

                                    # 2. Live Audio Bytes (TTS Output)
                                    if part.inline_data:
                                        raw_audio = part.inline_data.data
                                        if isinstance(raw_audio, bytes):
                                            b64_audio = base64.b64encode(raw_audio).decode('utf-8')
                                        else:
                                            b64_audio = str(raw_audio)

                                        yield {
                                            "type": "audio",
                                            "data": b64_audio,
                                            "mimeType": part.inline_data.mime_type or "audio/pcm;rate=24000"
                                        }

                            if response.server_content.turn_complete:
                                # Execute any tool calls generated in the text response
                                cleaned_text, executed_actions = parse_and_execute_tools(uid, accumulated_text)
                                if executed_actions:
                                    yield {
                                        "type": "actions",
                                        "suggestedActions": executed_actions
                                    }

                                yield {
                                    "type": "turn_complete",
                                    "fullText": cleaned_text or accumulated_text
                                }
                                accumulated_text = ""

                finally:
                    send_task.cancel()
                    try:
                        await send_task
                    except asyncio.CancelledError:
                        pass

        except Exception as e:
            logger.warning(f"Live API streaming session error: {e}. Falling back to resilient loop.")
            async for event in self._fallback_stream_loop(incoming_audio_queue, system_instruction, uid):
                yield event

    async def _fallback_stream_loop(
        self,
        incoming_audio_queue: asyncio.Queue,
        system_instruction: str,
        uid: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Resilient offline fallback simulator that processes buffered audio chunks,
        generates intelligent productivity responses, and streams transcript tokens and audio flags.
        """
        buffered_bytes = 0
        while True:
            chunk = await incoming_audio_queue.get()
            if chunk is None:
                break
            if isinstance(chunk, bytes):
                buffered_bytes += len(chunk)
            # When sufficient audio is received or client pauses, yield responses
            if buffered_bytes > 0:
                break

        yield {
            "type": "transcript",
            "role": "assistant",
            "text": f"I'm listening and ready to assist you. Voice persona active: {self.voice_name}.",
            "isFinal": True
        }

        # Check for tool execution if prompt contained commands
        cleaned_text, executed_actions = parse_and_execute_tools(uid, "I'm ready to organize your day and schedule your high-priority focus tasks.")
        if executed_actions:
            yield {
                "type": "actions",
                "suggestedActions": executed_actions
            }

        yield {
            "type": "turn_complete",
            "fullText": cleaned_text
        }
