import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.api.brain_dump import extract_and_persist_tasks

client = TestClient(app)

@pytest.mark.asyncio
async def test_brain_dump_filler_and_correction_resolution():
    """
    Test that voice brain dump prompt extracts structured tasks correctly
    from transcripts containing speech self-corrections and domain terms.
    """
    sample_transcript = (
        "I need to revise DBMS relational indexing for my exam, "
        "complete the full-stack API integration for Saarathi OS before 8 PM, "
        "go for a 45-minute gym session, and call my mother."
    )

    mock_llm_json = {
        "extractedTasks": [
            {
                "title": "Revise DBMS Relational Indexing",
                "category": "College",
                "energyRequired": "High",
                "estimatedDuration": 60,
                "deadline": "2026-08-28T18:00:00Z"
            },
            {
                "title": "Complete Saarathi OS full-stack API integration",
                "category": "Coding",
                "energyRequired": "High",
                "estimatedDuration": 90,
                "deadline": "2026-08-28T20:00:00Z"
            },
            {
                "title": "45-minute Gym Session",
                "category": "Health",
                "energyRequired": "Medium",
                "estimatedDuration": 45,
                "deadline": None
            },
            {
                "title": "Call Mother",
                "category": "Personal",
                "energyRequired": "Low",
                "estimatedDuration": 20,
                "deadline": None
            }
        ]
    }

    with patch("app.api.brain_dump.call_resilient_chat_llm", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = (f"```json\n{json.dumps(mock_llm_json)}\n```", "llama-3.3-70b-specdec")

        bd_id, tasks, provider = await extract_and_persist_tasks(
            uid="test_voice_user_1",
            transcript=sample_transcript
        )

        assert len(tasks) == 4
        assert tasks[0].title == "Revise DBMS Relational Indexing"
        assert tasks[1].title == "Complete Saarathi OS full-stack API integration"
        assert tasks[2].title == "45-minute Gym Session"
        assert tasks[3].title == "Call Mother"
        assert bd_id is not None

@pytest.mark.asyncio
async def test_brain_dump_audio_endpoint_with_gemini():
    """
    Test /v1/brain-dump/audio endpoint with mocked Gemini STT and token authentication.
    """
    mock_wav = b"RIFF" + b"\x00" * 200

    with patch("app.core.security.verify_firebase_token", return_value="test_voice_user_2"), \
         patch("app.services.stt.stt_service.stt_manager.transcribe", new_callable=AsyncMock) as mock_stt, \
         patch("app.api.brain_dump.call_resilient_chat_llm", new_callable=AsyncMock) as mock_llm:

        mock_stt.return_value = ("Finish the Saarathi deployment plan and check tests", "gemini_transcribe")
        mock_llm.return_value = (
            '```json\n{"extractedTasks": [{"title": "Finish Saarathi deployment plan", "category": "Coding", "energyRequired": "Medium", "estimatedDuration": 30}]}\n```',
            "gemini-2.5-flash"
        )

        response = client.post(
            "/v1/brain-dump/audio",
            headers={"Authorization": "Bearer test_valid_token"},
            files={"audio": ("voice_note.wav", mock_wav, "audio/wav")},
            data={"mode": "smart"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "gemini_transcribe" in data["providerUsed"]
        assert len(data["extractedTasks"]) == 1
        assert data["extractedTasks"][0]["title"] == "Finish Saarathi deployment plan"

@pytest.mark.asyncio
async def test_brain_dump_multilingual_code_switching():
    """
    Test extraction from Hindi/English code-switched transcript.
    """
    hinglish_transcript = "Kal subah 10 baje team meeting conduct karni hai and Saarathi architecture review complete karna hai."

    mock_llm_json = {
        "extractedTasks": [
            {
                "title": "Conduct team meeting",
                "category": "Work",
                "energyRequired": "Medium",
                "estimatedDuration": 45,
                "deadline": "2026-08-29T10:00:00Z"
            },
            {
                "title": "Complete Saarathi architecture review",
                "category": "Coding",
                "energyRequired": "High",
                "estimatedDuration": 60,
                "deadline": None
            }
        ]
    }

    with patch("app.api.brain_dump.call_resilient_chat_llm", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = (f"```json\n{json.dumps(mock_llm_json)}\n```", "llama-3.3-70b-specdec")

        bd_id, tasks, provider = await extract_and_persist_tasks(
            uid="test_voice_user_3",
            transcript=hinglish_transcript
        )

        assert len(tasks) == 2
        assert "team meeting" in tasks[0].title.lower()
        assert "saarathi" in tasks[1].title.lower()
