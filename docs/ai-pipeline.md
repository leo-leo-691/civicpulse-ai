# AI Pipeline Specification

## Pipeline Stages

```text
Input (Voice/Text/WhatsApp) → STT → Language Detection → LLM Extraction (Pydantic Schema)
→ Duplicate Check (Cosine Similarity > 0.95) → Vector Embeddings (pgvector)
→ Spatial Clustering → Priority Engine + Digital-Access Correction → Explainable Recommendation
```

### 1. Ingestion & Speech-to-Text
- Input received via Web UI or Webhook (`/api/v1/channels/messaging/webhook`).
- Voice audio transcribed via `GoogleSpeechProvider` abstraction.
- ISO language code detected (English, Hindi, Marathi, Portuguese).

### 2. Pydantic Schema Extraction
- LLM prompt enforces strict Pydantic JSON schema output (`ExtractedCitizenRequest`).
- Structured fields: `category`, `subcategory`, `severity`, `urgency`, `affected_groups`, `issue_summary`.

### 3. Section 13 Duplicate Collapse
- Cosine similarity calculated between new request embedding and existing location embeddings.
- If similarity &gt;= 0.95: Request marked as duplicate, linked via `duplicate_of_id`, and original request's `duplicate_count` incremented.

### 4. Priority Engine & Digital Divide Correction
- 7-Factor mathematical scoring formula:
  - Demand (25%), Infrastructure Gap (20%), Population Impact (15%), Vulnerability (15%), Investment Gap (10%), Urgency (10%).
- Digital-Access Correction (+N points) applied if infrastructure gap &gt;= 60% and mobile penetration &lt;= 55%.
