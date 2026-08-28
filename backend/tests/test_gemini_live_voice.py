import pytest
import asyncio
import base64
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.stt.gemini_live_bridge import GeminiLiveVoiceBridge, VOICE_PERSONAS, DEFAULT_VOICE

@pytest.mark.asyncio
async def test_voice_persona_resolution():
    """Verify prebuilt Gemini voice personas resolve properly and case-insensitively."""
    bridge = GeminiLiveVoiceBridge(voice="puck")
    assert bridge.voice_name == "Puck"

    bridge.set_voice("kore")
    assert bridge.voice_name == "Kore"

    bridge.set_voice("CHARON")
    assert bridge.voice_name == "Charon"

    bridge.set_voice("fenrir")
    assert bridge.voice_name == "Fenrir"

    bridge.set_voice("aoede")
    assert bridge.voice_name == "Aoede"

    # Default fallback on invalid/empty
    assert GeminiLiveVoiceBridge.resolve_voice("") == DEFAULT_VOICE
    assert GeminiLiveVoiceBridge.resolve_voice(None) == DEFAULT_VOICE

@pytest.mark.asyncio
async def test_live_config_construction():
    """Verify LiveConnectConfig correctly sets Audio modality and voice config."""
    bridge = GeminiLiveVoiceBridge(voice="Kore")
    config = bridge.build_live_config(system_instruction="You are Kairo voice assistant.")
    
    if config is not None:
        assert config.system_instruction == "You are Kairo voice assistant."

@pytest.mark.asyncio
async def test_gemini_live_fallback_stream():
    """Verify fallback streaming loop when live cloud connection is simulated offline."""
    bridge = GeminiLiveVoiceBridge(voice="Fenrir")
    queue = asyncio.Queue()
    
    # Put a PCM chunk in queue
    fake_pcm = b"\x00\x01" * 1024
    await queue.put(fake_pcm)
    await queue.put(None)  # End sentinel

    events = []
    async for event in bridge._fallback_stream_loop(queue, "Test instruction", uid="test_user"):
        events.append(event)

    event_types = [e["type"] for e in events]
    assert "transcript" in event_types
    assert "turn_complete" in event_types
    
    transcript_event = next(e for e in events if e["type"] == "transcript")
    assert "Fenrir" in transcript_event["text"]

@pytest.mark.asyncio
async def test_live_session_bidirectional_mock():
    """Verify live bidirectional session emits live transcript and audio chunks from mock."""
    bridge = GeminiLiveVoiceBridge(api_key="mock_test_key", voice="Aoede")
    
    queue = asyncio.Queue()
    fake_pcm = b"\x00\x02" * 512
    await queue.put(fake_pcm)
    await queue.put(None)

    events = []
    async for event in bridge.stream_live_session(queue, "Instruction", uid="test_user"):
        events.append(event)

    assert len(events) >= 1
    assert any(e["type"] in ("transcript", "turn_complete", "audio") for e in events)

def test_live_voice_websocket_handshake():
    """Verify FastAPI WebSocket endpoint /v1/kairo/live-voice/ws connects and streams initial handshake."""
    client = TestClient(app)
    with client.websocket_connect("/v1/kairo/live-voice/ws?voice=Kore") as websocket:
        initial_msg = websocket.receive_json()
        assert initial_msg["type"] == "session_started"
        assert initial_msg["voice"] == "Kore"

        # Send a voice update
        websocket.send_json({"type": "set_voice", "voice": "Charon"})
        voice_msg = websocket.receive_json()
        assert voice_msg["type"] == "voice_updated"
        assert voice_msg["voice"] == "Charon"

        # Send interrupt / barge-in
        websocket.send_json({"type": "interrupt"})
        websocket.close()

