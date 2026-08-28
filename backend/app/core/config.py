import os
import logging
from enum import Enum
from pathlib import Path
from typing import List, Set
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

logger = logging.getLogger(__name__)

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

class SecretClassification(str, Enum):
    PUBLIC_CLIENT_CONFIG = "PUBLIC_CLIENT_CONFIG"
    SERVER_SECRET = "SERVER_SECRET"
    SERVER_CONFIG = "SERVER_CONFIG"

SECRET_REGISTRY = {
    "FIREBASE_PROJECT_ID": SecretClassification.PUBLIC_CLIENT_CONFIG,
    "GOOGLE_APPLICATION_CREDENTIALS": SecretClassification.SERVER_SECRET,
    "FIREBASE_CREDENTIALS_JSON": SecretClassification.SERVER_SECRET,
    "GROQ_API_KEY": SecretClassification.SERVER_SECRET,
    "GEMINI_API_KEY": SecretClassification.SERVER_SECRET,
    "DEEPGRAM_API_KEY": SecretClassification.SERVER_SECRET,
    "SUPABASE_URL": SecretClassification.SERVER_CONFIG,
    "SUPABASE_SERVICE_ROLE_KEY": SecretClassification.SERVER_SECRET,
    "ENVIRONMENT": SecretClassification.SERVER_CONFIG,
    "PORT": SecretClassification.SERVER_CONFIG,
    "HOST": SecretClassification.SERVER_CONFIG,
    "CORS_ALLOWED_ORIGINS": SecretClassification.SERVER_CONFIG,
    "ADMIN_EMAILS": SecretClassification.SERVER_CONFIG,
    "ADMIN_UIDS": SecretClassification.SERVER_CONFIG,
}

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
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:8081,http://127.0.0.1:5173,http://127.0.0.1:3000"
    ADMIN_EMAILS: str = "admin@saarathi.app,siddharth@saarathi.app"
    ADMIN_UIDS: str = "admin-uid,admin_saarathi_root"

    model_config = SettingsConfigDict(
        env_file=(str(backend_env), str(root_env)),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ["prod", "production"]

    @property
    def allowed_cors_origins(self) -> List[str]:
        if not self.CORS_ALLOWED_ORIGINS:
            return ["http://localhost:5173", "http://localhost:3000"]
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def admin_uid_set(self) -> Set[str]:
        return {uid.strip() for uid in self.ADMIN_UIDS.split(",") if uid.strip()}

    @property
    def admin_email_set(self) -> Set[str]:
        return {email.strip().lower() for email in self.ADMIN_EMAILS.split(",") if email.strip()}

    def validate_production_environment(self) -> None:
        """
        Validates environment variables in production mode.
        Logs warnings if optional/mandatory production secrets are missing,
        enabling graceful degradation and healthcheck availability.
        """
        if not self.is_production:
            return

        missing_secrets = []
        if not self.FIREBASE_PROJECT_ID or self.FIREBASE_PROJECT_ID == "placeholder":
            missing_secrets.append("FIREBASE_PROJECT_ID")
        
        has_firebase_creds = bool(
            self.GOOGLE_APPLICATION_CREDENTIALS or self.FIREBASE_CREDENTIALS_JSON
        )
        if not has_firebase_creds and not os.getenv("K_SERVICE"):
            missing_secrets.append("GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_CREDENTIALS_JSON")

        if missing_secrets:
            error_msg = f"WARNING: Missing production secrets: {', '.join(missing_secrets)}. Running in resilient fallback mode until secrets are configured in dashboard."
            logger.warning(error_msg)


settings = Settings()
