import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.resilience.circuit_breaker import circuit_registry
from fastapi import HTTPException

client = TestClient(app)

def test_chaos_ai_complete_outage_todo_continues():
    """
    Core Todo principle: AI FAILURE != SAARATHI FAILURE.
    When Groq and Gemini are both unavailable (500 errors), chat returns safe guidance
    and task operations continue without throwing 500 errors.
    """
    with patch("app.services.ai_service._raw_call_groq", new_callable=AsyncMock) as mock_groq, \
         patch("app.services.ai_service._raw_call_gemini", new_callable=AsyncMock) as mock_gemini:
        mock_groq.side_effect = HTTPException(status_code=503, detail="Groq Down")
        mock_gemini.side_effect = HTTPException(status_code=503, detail="Gemini Down")

        # Chat endpoint must degrade gracefully rather than return 500
        chat_res = client.post("/v1/kairo/chat", json={"message": "What should I do now?"})
        assert chat_res.status_code == 200
        data = chat_res.json()
        assert data["providerUsed"] == "local_fallback"
        assert len(data["message"]) > 0

def test_chaos_daily_brief_ai_down_returns_offline_brief():
    """Daily brief returns offline heuristic briefing when LLM fails."""
    with patch("app.services.ai_service._raw_call_gemini", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.side_effect = HTTPException(status_code=500, detail="Gemini Outage")

        res = client.get("/v1/kairo/daily-brief")
        assert res.status_code == 200
        data = res.json()
        assert "greeting" in data
        assert "optimalFocusWindow" in data

def test_chaos_stt_failure_reassuring_message():
    """When audio STT fails, returns clear error response without raw stack trace."""
    with patch("app.api.brain_dump.stt_manager.transcribe", new_callable=AsyncMock) as mock_transcribe:
        mock_transcribe.side_effect = HTTPException(
            status_code=503,
            detail="Voice transcription is temporarily unavailable across all providers. Your audio has been queued for later processing."
        )

        res = client.post(
            "/v1/brain-dump/audio",
            files={"audio": ("test.wav", b"fake audio data", "audio/wav")}
        )
        assert res.status_code == 503
        assert "temporarily unavailable" in res.json()["detail"]
