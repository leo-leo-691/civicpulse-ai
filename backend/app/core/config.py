import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicPulse AI"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "civicpulse-secret-key-change-in-production-brics-2026")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/civicpulse_db")
    
    # AI Providers
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "gemini")
    DEFAULT_EMBEDDING_PROVIDER: str = os.getenv("DEFAULT_EMBEDDING_PROVIDER", "gemini")
    DEFAULT_SPEECH_PROVIDER: str = os.getenv("DEFAULT_SPEECH_PROVIDER", "google")
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Thresholds
    DUPLICATE_SIMILARITY_THRESHOLD: float = float(os.getenv("DUPLICATE_SIMILARITY_THRESHOLD", "0.95"))
    MAX_SUBMISSIONS_PER_HOUR: int = int(os.getenv("MAX_SUBMISSIONS_PER_HOUR", "10"))
    
    class Config:
        case_sensitive = True

settings = Settings()
