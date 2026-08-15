import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine directory paths
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BACKEND_DIR.parent

backend_env = BACKEND_DIR / ".env"
root_env = ROOT_DIR / ".env"

# Explicitly load .env into environment
if backend_env.exists():
    load_dotenv(backend_env, override=False)
if root_env.exists():
    load_dotenv(root_env, override=False)

class Settings(BaseSettings):
    FIREBASE_PROJECT_ID: str = "saarathi-331b4"
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    FIREBASE_CREDENTIALS_JSON: str = ""
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    DEEPGRAM_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    model_config = SettingsConfigDict(
        env_file=(str(backend_env), str(root_env)),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

