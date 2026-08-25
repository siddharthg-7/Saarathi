from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, ml, brain_dump, kairo, telemetry, analytics, xai

app = FastAPI(
    title="Saarathi OS AI Backend Gateway",
    description="FastAPI Backend for Saarathi & Kairo AI Assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ml.router)
app.include_router(xai.router)
app.include_router(brain_dump.router)
app.include_router(kairo.router)
app.include_router(telemetry.router)
app.include_router(analytics.router)

@app.get("/")
async def root():
    return {"message": "Saarathi OS Backend Gateway Active", "docs": "/docs"}

@app.get("/v1/health")
async def health():
    return {"status": "ok", "service": "Saarathi FastAPI", "version": "1.0.0"}
