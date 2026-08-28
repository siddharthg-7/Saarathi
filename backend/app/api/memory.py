import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.core.security import verify_firebase_token
from app.core.rate_limiter import rate_limit, RateLimitTier
from app.core.audit import audit_logger
from app.models import (
    MemoryCreateRequest,
    MemoryUpdateRequest,
    MemorySearchRequest,
    MemorySearchResponse,
    MemoryItemModel,
    MemoryStatsResponse,
)
from app.services.memory.memory_service import MemoryService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/memory", tags=["Long-Term Memory"])

@router.post("/index", response_model=MemoryItemModel, dependencies=[Depends(rate_limit(RateLimitTier.DEFAULT))])
async def index_memory(
    req: MemoryCreateRequest,
    uid: str = Depends(verify_firebase_token)
):
    """Index a new piece of semantic memory for the authenticated user."""
    try:
        return MemoryService.index_memory(uid=uid, req=req)
    except Exception as e:
        logger.error(f"Error indexing memory for user {uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to index memory")

@router.post("/search", response_model=MemorySearchResponse, dependencies=[Depends(rate_limit(RateLimitTier.MEMORY_SEARCH))])
async def search_memories(
    req: MemorySearchRequest,
    uid: str = Depends(verify_firebase_token)
):
    """Perform hybrid semantic vector and full-text search across user's long-term memory."""
    try:
        return MemoryService.search_memories(uid=uid, req=req)
    except Exception as e:
        logger.error(f"Error searching memories for user {uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to search memories")

@router.get("", response_model=List[MemoryItemModel])
async def list_memories(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sourceType: Optional[str] = Query(None),
    isActive: bool = Query(True),
    uid: str = Depends(verify_firebase_token)
):
    """List persistent memories for the authenticated user."""
    try:
        return MemoryService.list_memories(
            uid=uid,
            limit=limit,
            offset=offset,
            source_type=sourceType,
            is_active=isActive,
        )
    except Exception as e:
        logger.error(f"Error listing memories for user {uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to list memories")

@router.get("/stats", response_model=MemoryStatsResponse)
async def get_memory_stats(
    uid: str = Depends(verify_firebase_token)
):
    """Get memory statistics and source breakdown for the authenticated user."""
    try:
        return MemoryService.get_stats(uid=uid)
    except Exception as e:
        logger.error(f"Error fetching memory stats for user {uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch memory stats")

@router.get("/{memory_id}", response_model=MemoryItemModel)
async def get_memory(
    memory_id: str,
    uid: str = Depends(verify_firebase_token)
):
    """Get a specific memory item by ID."""
    item = MemoryService.get_memory(uid=uid, memory_id=memory_id)
    if not item:
        raise HTTPException(status_code=404, detail="Memory item not found")
    return item

@router.patch("/{memory_id}", response_model=MemoryItemModel)
async def update_memory(
    memory_id: str,
    req: MemoryUpdateRequest,
    uid: str = Depends(verify_firebase_token)
):
    """Update memory content, metadata, or active status."""
    item = MemoryService.update_memory(uid=uid, memory_id=memory_id, req=req)
    if not item:
        raise HTTPException(status_code=404, detail="Memory item not found")
    return item

@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: str,
    hard: bool = Query(False),
    uid: str = Depends(verify_firebase_token)
):
    """Delete or deactivate a memory item with audit logging."""
    success = MemoryService.delete_memory(uid=uid, memory_id=memory_id, hard_delete=hard)
    audit_logger.log(
        user_id=uid,
        action="memory.delete",
        resource_type="memory",
        resource_id=memory_id,
        result="success" if success else "error",
        metadata={"hard_delete": hard}
    )
    return {"status": "ok", "deleted": success, "memoryId": memory_id}

@router.post("/clear")
async def clear_all_memories(
    uid: str = Depends(verify_firebase_token)
):
    """Clear all long-term memories for the authenticated user with audit logging."""
    count = MemoryService.clear_memories(uid=uid)
    audit_logger.log(
        user_id=uid,
        action="memory.clear",
        resource_type="memory",
        result="success",
        metadata={"cleared_count": count}
    )
    return {"status": "ok", "clearedCount": count}
