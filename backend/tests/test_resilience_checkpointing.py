import pytest
from app.services.firestore_service import save_checkpoint_doc, get_checkpoint_doc
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_save_and_retrieve_checkpoint():
    uid = "dev-user-uid"
    cp_id = "cp_test_999"

    save_checkpoint_doc(
        checkpoint_id=cp_id,
        uid=uid,
        stage="transcribed",
        raw_transcript="Revise for my calculus exam and call Sarah."
    )

    retrieved = get_checkpoint_doc(uid, cp_id)
    assert retrieved is not None
    assert retrieved["checkpointId"] == cp_id
    assert retrieved["stage"] == "transcribed"
    assert "calculus" in retrieved["rawTranscript"]

def test_checkpoint_isolation():
    uid_a = "user_alpha"
    uid_b = "user_bravo"
    cp_id = "cp_isolated_123"

    save_checkpoint_doc(checkpoint_id=cp_id, uid=uid_a, stage="audio_saved")

    # User B should NOT be able to access User A's checkpoint
    assert get_checkpoint_doc(uid_b, cp_id) is None
    # User A should be able to access it
    assert get_checkpoint_doc(uid_a, cp_id) is not None

def test_resume_checkpoint_endpoint():
    uid = "dev-user-uid"
    cp_id = "cp_resume_test_456"

    save_checkpoint_doc(
        checkpoint_id=cp_id,
        uid=uid,
        stage="transcribed",
        raw_transcript="I need to clean my room and finish the chemistry assignment."
    )

    response = client.post(f"/v1/brain-dump/resume/{cp_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "clean my room" in data["rawTranscript"]
    assert len(data["extractedTasks"]) > 0
