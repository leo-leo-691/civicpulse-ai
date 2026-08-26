import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL

# Fallback to SQLite in-memory or local sqlite for seamless local testing if postgres not available
if "sqlite" in db_url or os.getenv("USE_SQLITE", "False").lower() == "true":
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
