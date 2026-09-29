import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL

if os.getenv("USE_SQLITE", "False").lower() == "true":
    db_url = os.getenv("DATABASE_URL", "sqlite:///./civicpulse_dev.db")
    if not db_url.startswith("sqlite"):
        db_url = "sqlite:///./civicpulse_dev.db"

if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

if "sqlite" in db_url:
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    try:
        engine = create_engine(db_url, pool_pre_ping=True)
    except Exception:
        # Graceful fallback for local dev setup without docker
        sqlite_url = "sqlite:///./civicpulse_dev.db"
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
