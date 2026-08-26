# CivicPulse AI (v2)

> **From Citizen Voice to Evidence-Based Public Investment**

CivicPulse AI is a scalable, multilingual AI public infrastructure decision-support platform designed as a **Digital Public Good (DPG)** for BRICS nations.

---

## 🌟 Core Features

- 🎤 **Multi-Channel Citizen Ingestion**: Web Voice, Web Text, and simulated Messaging Webhook (WhatsApp / SMS / Telegram).
- 🗣️ **Multilingual Understanding**: Native support for English, Hindi, Marathi, and extensible BRICS language packs (e.g., Portuguese).
- 🔍 **Duplicate Collapse vs. Semantic Clustering**: Separates repeat submissions (incrementing `duplicate_count`) from distinct related issues grouped into geographic clusters.
- ⚖️ **Digital-Divide Corrected Priority Engine**: Transparent 7-factor mathematical formula that applies positive corrections (+N priority points) to under-reported high-gap regions with low digital access.
- 📊 **Hotspot Intelligence & GIS Map**: Interactive Leaflet / PostGIS spatial visualization of regional demand, infrastructure gaps, and investment coverage.
- 💡 **Explainable Recommendations & Human-in-the-Loop**: Comprehensive evidence panel explaining exact score calculations; policymaker approval workflow.
- 📈 **Retrospective Investment Impact Tracking**: Tracks pre- vs. post-project infrastructure indices and complaint drops for completed investments, proving real-world ROI.
- 🔔 **Citizen Status Feedback Loop**: Allows citizens to look up `#REQ-xxxxx` status without requiring sign-in.
- 🌐 **Digital Public Good Standard**: Apache 2.0 licensed, SDG aligned, with open data export (`/api/v1/open-data/export`).

---

## 🏗️ Repository Architecture

```text
civicpulse-ai/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/v1/          # REST Endpoints & Webhooks
│   │   ├── ai/              # Provider Abstraction & Extraction Pipeline
│   │   ├── core/            # Config, DB, Security
│   │   ├── models/          # SQLAlchemy Database Models
│   │   ├── schemas/         # Pydantic Schemas & Validation
│   │   └── services/        # Priority Engine & Impact Tracker
│   └── tests/               # Pytest Suite
├── frontend/                 # Next.js 14 Web Application
│   ├── src/app/             # App Router Pages (Citizen Portal & Dashboard)
│   ├── src/components/      # UI, Maps, Charts, Evidence Panel
│   └── src/lib/             # API Client & Helpers
├── data/                    # Synthetic & Seeder Datasets
├── docs/                    # Architecture, API & DPG Compliance Docs
├── scripts/                 # Seeder & Demo Scripts
├── docker-compose.yml       # PostgreSQL + PostGIS + pgvector + Redis
├── LICENSE                  # Apache 2.0 License
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16+ with `postgis` & `pgvector` extensions (or Docker)

### Quick Start (Local Development)

1. **Clone & Setup Environment**
   ```bash
   cp .env.example .env
   ```

2. **Start Backend (FastAPI)**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

3. **Seed Demo Data**
   ```bash
   python scripts/seed_demo_data.py
   ```

4. **Start Frontend (Next.js)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` for Citizen Portal & Policymaker Dashboard.

---

## 📜 License & DPG Compliance

Licensed under the [Apache License 2.0](LICENSE). Complies with the 9 indicators of the Digital Public Goods Alliance standard (see [docs/dpg-compliance.md](docs/dpg-compliance.md)).
