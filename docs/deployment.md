# Deployment & Execution Guide

CivicPulse AI supports both local developer setup and containerized Docker Compose deployment.

---

## Docker Compose Deployment

```bash
# Start PostgreSQL (PostGIS + pgvector), Redis, FastAPI backend, and Next.js frontend
docker-compose up -d --build

# Seed demo dataset
docker-compose exec backend python scripts/seed_demo_data.py
```

- **Frontend Application:** `http://localhost:3000`
- **FastAPI Backend & Swagger Docs:** `http://localhost:8000/docs`
- **OpenAPI Schema:** `http://localhost:8000/api/v1/openapi.json`

---

## Local Development (Without Docker)

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python scripts/seed_demo_data.py
uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
