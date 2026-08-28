import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
from app.services.stt.gemini_provider import GeminiTranscribeProvider, DEFAULT_SAARATHI_VOCABULARY
from app.services.stt.gemini_live_provider import GeminiLiveSTTProvider
from app.services.stt.stt_service import ResilientSTTManager, validate_audio_input
from app.core.resilience.circuit_breaker import circuit_registry, CircuitBreakerOpenException

@pytest.fixture(autouse=True)
def reset_all_circuits():
    circuit_registry.reset_all()

@pytest.fixture(autouse=True)
def mock_gemini_api_key():
    with patch("app.services.stt.gemini_provider.settings.GEMINI_API_KEY", "mock-key"):
        yield

@pytest.mark.asyncio
async def test_audio_input_validation():
    # 1. Empty payload rejected
    with pytest.raises(HTTPException) as exc_info:
        validate_audio_input(b"")
    assert exc_info.value.status_code == 400

    # 2. Oversized payload rejected
    oversized = b"x" * (26 * 1024 * 1024)
    with pytest.raises(HTTPException) as exc_info:
        validate_audio_input(oversized)
    assert exc_info.value.status_code == 400

    # 3. Valid content types recognized
    valid_wav = b"RIFF" + b"\x00" * 100
    assert validate_audio_input(valid_wav, "audio/wav") == "audio/wav"
    assert validate_audio_input(valid_wav, filename="note.m4a") == "audio/m4a"
    assert validate_audio_input(valid_wav, filename="note.mp3") == "audio/mpeg"

@pytest.mark.asyncio
async def test_gemini_transcribe_smart_mode():
    provider = GeminiTranscribeProvider()
    mock_audio = b"RIFF" + b"\x00" * 500

    # Mock successful Gemini API response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {"text": "I need to complete the Saarathi voice pipeline integration and submit report tomorrow at 5 PM."}
                    ]
                }
            }
        ]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        transcript = await provider.transcribe(
            audio_data=mock_audio,
            content_type="audio/wav",
            mode="smart",
            custom_vocabulary=["Saarathi", "Kairo"]
        )

        assert "Saarathi voice pipeline integration" in transcript
        assert mock_post.called
        # Verify custom vocab and system prompt was included
        call_kwargs = mock_post.call_args[1]
        system_instruction = call_kwargs["json"]["systemInstruction"]["parts"][0]["text"]
        assert "Saarathi" in system_instruction
        assert "Kairo" in system_instruction

@pytest.mark.asyncio
async def test_gemini_transcribe_verbatim_mode():
    provider = GeminiTranscribeProvider()
    mock_audio = b"RIFF" + b"\x00" * 500

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {"text": "Um, I need to, uh, complete the task, you know."}
                    ]
                }
            }
        ]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        transcript = await provider.transcribe(
            audio_data=mock_audio,
            content_type="audio/wav",
            mode="verbatim"
        )

        assert "Um, I need to" in transcript
        call_kwargs = mock_post.call_args[1]
        assert call_kwargs["json"]["generationConfig"]["temperature"] == 0.0

@pytest.mark.asyncio
async def test_gemini_transcribe_rate_limit_and_circuit_breaker():
    provider = GeminiTranscribeProvider()
    mock_audio = b"RIFF" + b"\x00" * 500

    # Simulate 429 Too Many Requests
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_response.text = "Quota exceeded"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        # Consecutive failures trip the circuit breaker
        for _ in range(5):
            try:
                await provider.transcribe(audio_data=mock_audio)
            except HTTPException:
                pass

        # Circuit should now be open
        cb = circuit_registry.get("gemini_transcribe")
        assert not cb.can_execute()

        with pytest.raises(CircuitBreakerOpenException):
            await provider.transcribe(audio_data=mock_audio)

@pytest.mark.asyncio
async def test_stt_router_prioritized_fallback():
    """
    Test Priority Hierarchy:
    1. Gemini fails -> Fallback to Deepgram.
    2. Deepgram fails -> Fallback to Whisper.
    """
    manager = ResilientSTTManager()
    mock_audio = b"RIFF" + b"\x00" * 500

    # Scenario A: Gemini succeeds
    with patch.object(manager.gemini_provider, "transcribe", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = "Gemini primary transcript"
        text, provider = await manager.transcribe(mock_audio, content_type="audio/wav", uid="test_user")
        assert text == "Gemini primary transcript"
        assert provider == "gemini_transcribe"

    # Scenario B: Gemini fails -> Deepgram succeeds
    with patch.object(manager.gemini_provider, "transcribe", new_callable=AsyncMock) as mock_gemini, \
         patch.object(manager.deepgram_provider, "transcribe", new_callable=AsyncMock) as mock_deepgram:
        mock_gemini.side_effect = HTTPException(status_code=500, detail="Gemini backend down")
        mock_deepgram.return_value = "Deepgram fallback transcript"

        text, provider = await manager.transcribe(mock_audio, content_type="audio/wav", uid="test_user")
        assert text == "Deepgram fallback transcript"
        assert provider == "deepgram"

    # Scenario C: Gemini & Deepgram fail -> Whisper fallback succeeds
    with patch.object(manager.gemini_provider, "transcribe", new_callable=AsyncMock) as mock_gemini, \
         patch.object(manager.deepgram_provider, "transcribe", new_callable=AsyncMock) as mock_deepgram, \
         patch.object(manager.whisper_provider, "transcribe", new_callable=AsyncMock) as mock_whisper:
        mock_gemini.side_effect = HTTPException(status_code=500, detail="Gemini down")
        mock_deepgram.side_effect = HTTPException(status_code=500, detail="Deepgram down")
        mock_whisper.return_value = "Whisper fallback transcript"

        text, provider = await manager.transcribe(mock_audio, content_type="audio/wav", uid="test_user")
        assert text == "Whisper fallback transcript"
        assert provider == "whisper"

@pytest.mark.asyncio
async def test_gemini_live_stream_chunks():
    live_provider = GeminiLiveSTTProvider()

    async def sample_chunk_generator():
        yield b"CHUNK_1"
        yield b"CHUNK_2"
        yield b"CHUNK_3"

    with patch.object(live_provider, "transcribe", new_callable=AsyncMock) as mock_transcribe:
        mock_transcribe.return_value = "Final live transcript"

        events = []
        async for event in live_provider.stream_transcribe_chunks(sample_chunk_generator()):
            events.append(event)

        assert len(events) >= 3
        # Interims received
        assert events[0]["type"] == "interim"
        # Final received
        final_event = events[-1]
        assert final_event["type"] == "final"
        assert final_event["transcript"] == "Final live transcript"
        assert "latencyMs" in final_event
