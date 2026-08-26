import pytest
from app.core.resilience.idempotency import IdempotencyManager, IdempotencyStatus

def test_idempotency_key_generation_deterministic():
    k1 = IdempotencyManager.generate_key("user_123", "task_create", "task_abc")
    k2 = IdempotencyManager.generate_key("user_123", "task_create", "task_abc")
    k3 = IdempotencyManager.generate_key("user_456", "task_create", "task_abc")

    assert k1 == k2
    assert k1 != k3

def test_idempotency_lifecycle():
    mgr = IdempotencyManager()
    key = "idem_key_test_001"
    user_id = "user_123"

    # 1. First execution -> Starts operation
    is_dup, cached = mgr.check_or_start(key, user_id, "brain_dump")
    assert is_dup is False
    assert cached is None

    # 2. Second execution while in progress -> Marked as duplicate/in-progress
    is_dup2, cached2 = mgr.check_or_start(key, user_id, "brain_dump")
    assert is_dup2 is True
    assert cached2 is None

    # 3. Complete execution with payload
    expected_result = {"status": "success", "tasks": ["Task A", "Task B"]}
    mgr.complete(key, expected_result)

    # 4. Third execution after completion -> Returns cached result immediately
    is_dup3, cached3 = mgr.check_or_start(key, user_id, "brain_dump")
    assert is_dup3 is True
    assert cached3 == expected_result
