import pytest
from unittest.mock import patch, AsyncMock
from app.services.stt.stt_service import validate_audio_input, ResilientSTTManager
from app.core.resilience.circuit_breaker import circuit_registry, CircuitState
from fastapi import HTTPException

def test_validate_audio_input_valid():
    fake_wav = b"RIFF....WAVEfmt ...."
    ct = validate_audio_input(fake_wav, "audio/wav", "recording.wav")
    assert ct == "audio/wav"

def test_validate_audio_input_empty_raises_400():
    with pytest.raises(HTTPException) as exc_info:
        validate_audio_input(b"", "audio/wav")
    assert exc_info.value.status_code == 400

def test_validate_audio_input_oversized_raises_400():
    huge_bytes = b"0" * (26 * 1024 * 1024)  # 26MB > 25MB limit
    with pytest.raises(HTTPException) as exc_info:
        validate_audio_input(huge_bytes, "audio/wav")
    assert exc_info.value.status_code == 400

def test_validate_audio_input_unsupported_format_raises_400():
    with pytest.raises(HTTPException) as exc_info:
        validate_audio_input(b"some bytes", "video/mp4")
    assert exc_info.value.status_code == 400

@pytest.mark.asyncio
async def test_stt_manager_deepgram_primary_success():
    mgr = ResilientSTTManager()
    audio_bytes = b"dummy audio payload"

    with patch.object(mgr.primary_provider, "transcribe", new_callable=AsyncMock) as mock_deepgram:
        mock_deepgram.return_value = "This is a transcribed voice note."

        transcript, provider = await mgr.transcribe(audio_bytes, content_type="audio/wav")
        assert transcript == "This is a transcribed voice note."
        assert provider == "deepgram"
        assert mock_deepgram.call_count == 1

@pytest.mark.asyncio
async def test_stt_manager_fallback_to_whisper_on_deepgram_failure():
    mgr = ResilientSTTManager()
    audio_bytes = b"dummy audio payload"

    with patch.object(mgr.primary_provider, "transcribe", new_callable=AsyncMock) as mock_deepgram, \
         patch.object(mgr.fallback_provider, "transcribe", new_callable=AsyncMock) as mock_whisper:
        mock_deepgram.side_effect = HTTPException(status_code=503, detail="Deepgram unavailable")
        mock_whisper.return_value = "Whisper fallback transcript."

        transcript, provider = await mgr.transcribe(audio_bytes, content_type="audio/wav")
        assert transcript == "Whisper fallback transcript."
        assert provider == "whisper"
        assert mock_whisper.call_count == 1
