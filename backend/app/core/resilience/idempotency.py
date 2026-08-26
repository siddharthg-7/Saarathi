import hashlib
import time
import threading
import logging
from typing import Dict, Any, Optional, Tuple
from enum import Enum

logger = logging.getLogger(__name__)

class IdempotencyStatus(str, Enum):
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class IdempotencyRecord:
    def __init__(self, key: str, user_id: str, operation_type: str, ttl_seconds: int = 86400):
        self.key = key
        self.user_id = user_id
        self.operation_type = operation_type
        self.status = IdempotencyStatus.PROCESSING
        self.result: Optional[Any] = None
        self.created_at = time.time()
        self.expires_at = self.created_at + ttl_seconds
        self.error: Optional[str] = None

class IdempotencyManager:
    """
    In-memory and durable idempotency store to prevent duplicate operations
    during retries (e.g. Brain Dump processing, task generation, audio ingest, memory indexing).
    """
    _instance: Optional['IdempotencyManager'] = None
    _lock = threading.Lock()

    def __init__(self):
        self._records: Dict[str, IdempotencyRecord] = {}
        self._store_lock = threading.RLock()

    @classmethod
    def get_instance(cls) -> 'IdempotencyManager':
        with cls._lock:
            if cls._instance is None:
                cls._instance = IdempotencyManager()
            return cls._instance

    @staticmethod
    def generate_key(
        user_id: str,
        operation_type: str,
        source_id: str,
        operation_version: str = "v1"
    ) -> str:
        """
        Creates a deterministic hash key from user ID, operation type, source payload/id, and version.
        """
        raw = f"{user_id}:{operation_type}:{source_id}:{operation_version}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @staticmethod
    def hash_payload(data: Any) -> str:
        """
        Hashes any string, bytes, or dict into a stable checksum.
        """
        if isinstance(data, bytes):
            return hashlib.sha256(data).hexdigest()
        elif isinstance(data, dict):
            import json
            serialized = json.dumps(data, sort_keys=True)
            return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        else:
            return hashlib.sha256(str(data).encode("utf-8")).hexdigest()

    def check_or_start(
        self,
        key: str,
        user_id: str,
        operation_type: str,
        ttl_seconds: int = 86400
    ) -> Tuple[bool, Optional[Any]]:
        """
        Checks if an operation has already run or is currently in progress.
        Returns:
            (is_duplicate, cached_result)
            If is_duplicate is True: operation is already PROCESSING or COMPLETED.
            If is_duplicate is False: operation was started and registered as PROCESSING.
        """
        with self._store_lock:
            now = time.time()
            record = self._records.get(key)

            if record and record.expires_at > now:
                if record.status == IdempotencyStatus.COMPLETED:
                    logger.info(f"[Idempotency] Returning completed cached result for key: {key[:12]}...")
                    return True, record.result
                elif record.status == IdempotencyStatus.PROCESSING:
                    logger.info(f"[Idempotency] Operation already in progress for key: {key[:12]}...")
                    return True, None
                # If previously FAILED, allow re-execution

            # Start new execution
            new_record = IdempotencyRecord(key, user_id, operation_type, ttl_seconds)
            self._records[key] = new_record
            return False, None

    def complete(self, key: str, result: Any) -> None:
        """Marks the idempotency record as COMPLETED with its output payload."""
        with self._store_lock:
            if key in self._records:
                self._records[key].status = IdempotencyStatus.COMPLETED
                self._records[key].result = result

    def fail(self, key: str, error: str) -> None:
        """Marks the idempotency record as FAILED so it can be retried if appropriate."""
        with self._store_lock:
            if key in self._records:
                self._records[key].status = IdempotencyStatus.FAILED
                self._records[key].error = error

    def clear(self) -> None:
        """Clears all in-memory records (useful for test isolation)."""
        with self._store_lock:
            self._records.clear()

idempotency_manager = IdempotencyManager.get_instance()
