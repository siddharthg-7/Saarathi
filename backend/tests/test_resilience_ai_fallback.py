import pytest
from unittest.mock import patch, AsyncMock
from app.services.ai_service import call_resilient_chat_llm, call_groq_chat
from app.core.resilience.circuit_breaker import circuit_registry, CircuitState
from fastapi import HTTPException

@pytest.mark.asyncio
async def test_resilient_llm_groq_primary_success():
    messages = [{"role": "user", "content": "Hello Kairo"}]

    with patch("app.services.ai_service._raw_call_groq", new_callable=AsyncMock) as mock_groq:
        mock_groq.return_value = "Hello! I am ready to help you plan your day."

        resp, provider = await call_resilient_chat_llm(messages)
        assert "Hello!" in resp
        assert provider == "groq"
        assert mock_groq.call_count == 1

@pytest.mark.asyncio
async def test_resilient_llm_groq_500_fallback_to_gemini():
    messages = [{"role": "user", "content": "Suggest morning focus tasks"}]

    with patch("app.services.ai_service._raw_call_groq", new_callable=AsyncMock) as mock_groq, \
         patch("app.services.ai_service._raw_call_gemini", new_callable=AsyncMock) as mock_gemini:
        # Groq throws 500 error
        mock_groq.side_effect = HTTPException(status_code=500, detail="Groq server error")
        mock_gemini.return_value = "Gemini fallback: Focus on DBMS study."

        resp, provider = await call_resilient_chat_llm(messages)
        assert "Gemini fallback" in resp
        assert provider == "gemini"
        assert mock_gemini.call_count == 1

@pytest.mark.asyncio
async def test_resilient_llm_groq_circuit_open_direct_gemini_routing():
    messages = [{"role": "user", "content": "Schedule tasks"}]
    groq_cb = circuit_registry.get("groq")
    groq_cb.state = CircuitState.OPEN
    groq_cb.last_state_change = 9999999999.0  # Far in future so cooldown doesn't expire

    with patch("app.services.ai_service._raw_call_groq", new_callable=AsyncMock) as mock_groq, \
         patch("app.services.ai_service._raw_call_gemini", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = "Direct Gemini routing response."

        resp, provider = await call_resilient_chat_llm(messages)
        assert "Direct Gemini" in resp
        assert provider == "gemini"
        # Must not call groq at all while circuit is open
        assert mock_groq.call_count == 0

    groq_cb.reset()

@pytest.mark.asyncio
async def test_resilient_llm_no_fallback_on_400_invalid_request():
    messages = [{"role": "user", "content": "Invalid request"}]

    with patch("app.services.ai_service._raw_call_groq", new_callable=AsyncMock) as mock_groq, \
         patch("app.services.ai_service._raw_call_gemini", new_callable=AsyncMock) as mock_gemini:
        mock_groq.side_effect = HTTPException(status_code=400, detail="Bad Request - Invalid model parameters")

        with pytest.raises(HTTPException) as exc_info:
            await call_resilient_chat_llm(messages)

        assert exc_info.value.status_code == 400
        # Gemini fallback should NOT be called for client-side 400 errors
        assert mock_gemini.call_count == 0
