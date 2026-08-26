# Digital Public Good (DPG) Compliance Matrix

CivicPulse AI is architected in full alignment with the **Digital Public Goods Alliance (DPGA)** standard for open-source digital public infrastructure (DPI).

---

## The 9 DPGA Indicators Alignment

### 1. Relevance to Sustainable Development Goals (SDGs)
CivicPulse AI directly contributes to the following UN Sustainable Development Goals:
- **SDG 9: Industry, Innovation and Infrastructure** — Enables data-backed evidence generation for public infrastructure allocation.
- **SDG 10: Reduced Inequalities** — Implements a digital-access correction algorithm to prevent digital divide bias from ignoring vulnerable, low-connectivity populations.
- **SDG 11: Sustainable Cities and Communities** — Hotspot detection and spatial clustering for responsive municipal and rural planning.
- **SDG 16: Peace, Justice and Strong Institutions** — Promotes public expenditure transparency, citizen feedback loops, and human-in-the-loop auditability.

### 2. Approved Open License
- Distributed under the **Apache License 2.0** (see [LICENSE](../LICENSE)), an OSI-approved open license granting explicit patent rights and permissive reuse.

### 3. Clear Ownership
- Owned and maintained as an open BRICS Innovation Public Good project with documented repository ownership and commit history.

### 4. Platform Independence & Model Agnosticism
- Built using provider abstractions (`AIService`, `LLMProvider`, `EmbeddingProvider`, `SpeechProvider`).
- Prevents single-vendor lock-in: compatible with Google Gemini, open-source sovereign models (e.g., Llama 3, Mistral), or local LLM deployments.

### 5. Clear Documentation
- Comprehensive documentation available in `/docs/`:
  - `architecture.md`: Full multi-layer system architecture
  - `api.md`: OpenAPI / REST specifications
  - `ai-pipeline.md`: NLP, duplicate detection, and priority scoring specs
  - `dpg-compliance.md`: This compliance matrix
  - `deployment.md`: Containerized Docker & local execution guides

### 6. Mechanism for Extracting Data (Open Data Export)
- Provides an anonymized, aggregated open data API endpoint:
  `GET /api/v1/open-data/export`
- Formats supported: JSON / GeoJSON / CSV for public policy researchers, civil society, and international development organizations.

### 7. Adherence to Privacy and Applicable Laws
- Enforces strict PII (Personally Identifiable Information) minimization.
- Contact info / phone numbers are hashed (`reporter_hash`) strictly for rate-limiting and duplicate detection. Raw contact information is never saved alongside public request data.
- Compliant with Indian DPDP Act 2023 and global privacy standards.

### 8. Adherence to Standards and Best Practices
- RESTful OpenAPI v3 endpoints with Pydantic type validation.
- Standard spatial data formats (WGS84 EPSG:4326 GeoJSON via PostGIS).
- Vector embeddings stored using standard cosine similarity in `pgvector`.

### 9. Do No Harm by Design
- **Prompt Injection Defense:** Free-text citizen submissions are parsed as untrusted content using Pydantic JSON schemas. Free text cannot alter priority engine formulas.
- **Anti-Astroturfing:** Rate limiting and spatial anomaly detection prevent coordinated bot manipulation of demand scores.
- **Human-in-the-Loop Governance:** AI outputs are advisory recommendations only. The system explicitly blocks autonomous execution without formal policymaker decision logging.
