# CivicPulse AI — System Architecture & Design Specification

## Overview
CivicPulse AI is a scalable, multilingual AI public infrastructure decision-support platform designed as a **Digital Public Good (DPG)** for BRICS nations.

---

## 1. System Pipeline Architecture

```text
Citizen Voice / Text / WhatsApp / SMS
            ↓
     Speech-to-Text (if audio)
            ↓
    Language Detection (Hindi, Marathi, English, Portuguese)
            ↓
     AI Understanding (Pydantic JSON schema extraction)
            ↓
  Structured Citizen Request
            ↓
  Duplicate Check  ──→  Duplicate? → link to existing request, increment count, stop
            ↓ (not a duplicate)
  Semantic Vector Embeddings (pgvector)
            ↓
  Spatial Clustering (DBSCAN / Graph)
            ↓
  Geographic Hotspot Detection
            ↓
  ┌───────────────────────────────┐
  │ Demographic Data              │
  │ Infrastructure Data           │
  │ Public Investment Data        │
  │ Citizen Demand Data           │
  └───────────────────────────────┘
            ↓
  Deterministic Priority Engine (with Digital-Access Correction)
            ↓
  AI Recommendation + Evidence Panel
            ↓
     Policymaker Dashboard (Human-in-the-Loop Decision)
            ↓
    Retrospective Investment Impact Tracking (continuous before/after measurement)
            ↓
    Status pushed back to citizen (#REQ-XXXXX)
```

---

## 2. Decoupled AI Provider Abstraction
The AI intelligence stack uses provider abstraction interfaces:
- `LLMProvider` (Default: Gemini 1.5/2.0 API, Provider Agnostic)
- `EmbeddingProvider` (Default: Gemini Embeddings / Sentence-Transformers stored in `pgvector`)
- `SpeechProvider` (Default: Google Speech-to-Text)

---

## 3. Digital Public Good Compliance
- Licensed under **Apache License 2.0**.
- Aligned with UN SDGs 9, 10, 11, 16.
- Provides Open Data Export API (`GET /api/v1/open-data/export`).
