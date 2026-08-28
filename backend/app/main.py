import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure backend directory is in sys.path for direct module imports in deployment
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.core.security import sanitize_sensitive_data
from app.api import auth, ml, brain_dump, kairo, telemetry, analytics, xai, memory, resilience

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation: fail fast in production if required secrets are missing
    try:
        settings.validate_production_environment()
        logger.info("Security pre-flight & environment validation passed.")
    except Exception as e:
        logger.critical(f"Security pre-flight failed: {e}")
        if settings.is_production:
            raise
    yield

app = FastAPI(
    title="Saarathi OS AI Backend Gateway",
    description="FastAPI Backend for Saarathi & Kairo AI Assistant",
    version="1.0.0",
    lifespan=lifespan
)

# 1. Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "img-src 'self' data: https:; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "connect-src 'self' https: wss:;"
            )
        return response

app.add_middleware(SecurityHeadersMiddleware)

# 2. CORS Configuration (Explicit Allowed Origins)
allowed_origins = settings.allowed_cors_origins if settings.is_production else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True if not ("*" in allowed_origins) else False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 3. Global Production Exception Handler (Sanitized Error Responses)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_str = sanitize_sensitive_data(str(exc))
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {error_str}", exc_info=True)
    
    if settings.is_production:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "internal_server_error",
                "message": "An unexpected error occurred. Please try again later."
            }
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_server_error",
            "message": error_str
        }
    )

# 4. Route Registration
app.include_router(auth.router)
app.include_router(ml.router)
app.include_router(xai.router)
app.include_router(memory.router)
app.include_router(brain_dump.router)
app.include_router(kairo.router)
app.include_router(telemetry.router)
app.include_router(analytics.router)
app.include_router(resilience.router)

@app.get("/")
async def root():
    return {"message": "Saarathi OS Backend Gateway Active", "docs": "/docs"}

@app.get("/v1/health")
async def health():
    return {"status": "ok", "service": "Saarathi FastAPI", "version": "1.0.0"}
