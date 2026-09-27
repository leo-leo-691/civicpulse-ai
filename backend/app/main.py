from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.endpoints import router as api_v1_router
from app.models import domain # Ensure models registered

# Auto-create tables for seamless local dev/testing
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Scalable, Multilingual AI Public Infrastructure Decision-Support Platform (Digital Public Good)",
    openapi_url="/api/v1/openapi.json"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix=settings.API_V1_STR)

from app.core.database import SessionLocal
from app.ai.clustering import SemanticClusterEngine

@app.on_event("startup")
def startup_event():
    # Run DBSCAN batch clustering on startup to ensure demo dashboard shows DBSCAN output
    db = SessionLocal()
    try:
        engine = SemanticClusterEngine()
        engine.execute_batch_clustering(db)
        db.commit()
    except Exception as e:
        print(f"Startup clustering failed: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "dpg_status": "Compliant (Apache 2.0 / DPGA Standard)"
    }
