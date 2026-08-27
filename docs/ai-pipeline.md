# CivicPulse AI — Pipeline Specification & Architecture

## System Flow

```text
Citizen Input (Voice / Text / WhatsApp / SMS)
                 ↓
      Speech-to-Text (GoogleSpeechProvider)
                 ↓
      Language Detection (English, Hindi, Marathi, Portuguese)
                 ↓
      AI Extraction (Pydantic ExtractedCitizenRequest Schema Validation)
                 ↓
      Dynamic Vector Embedding Generation & Dimension Validation
                 ↓
  ┌─────────────────────────────────────────────────────────────┐
  │ Exact Unicode NFKC SHA-256 Hash Duplicate Check ($O(1)$)      │
  │ Candidate Cosine Similarity Check ($\ge 0.88$ threshold)     │
  └─────────────────────────────────────────────────────────────┘
                 ↓ (if duplicate) → Link `duplicate_of_id`, set status `"Merged into Duplicate"`,
                 │                     atomically increment `duplicate_count` on original.
                 ↓ (if primary request)
  Provisional Real-Time Cluster Assignment (Centroid Cosine Similarity)
                 ↓
  Authoritative Batch DBSCAN Semantic Clustering (`scikit-learn` Cosine Metric)
                 │  • Sparse Neighborhood Graph ($N > 5000$)
                 │  • Noise label -1 $\rightarrow$ `cluster_id = None` (No fake clusters)
                 │  • Archive stale active clusters & obsolete recommendations
                 ↓
  Ground-Truth Demographic Evidence Aggregation (`population_of_affected_locations`)
                 ↓
  Deterministic Priority Engine (with Digital-Access Correction)
                 ↓
  Evidence-Grounded Recommendation Synthesis & Programmatic Post-Validation
                 ↓
  Policymaker Dashboard Cards + DPG Open Data Export API (`GET /api/v1/open-data/export`)
```

---

## Stage Specifications

### 1. Ingestion & Speech-to-Text (`BaseSpeechProvider`)
- Voice audio transcribed via `GoogleSpeechProvider` (using GCP Speech API when credentials exist, or `DEVELOPMENT FALLBACK`).
- ISO language code preserved (`en`, `hi`, `mr`, `pt`).

### 2. Pydantic Schema Extraction (`BaseLLMProvider`)
- `GeminiLLMProvider` enforces strict Pydantic JSON schema output (`ExtractedCitizenRequest`).
- Structured fields: `category`, `subcategory`, `severity`, `urgency`, `affected_groups`, `issue_summary`, `potential_impact`, `location_mentions`, `language_detected`, `translated_text`.
- Provider status explicitly tagged in metadata (`REAL` vs `DEVELOPMENT FALLBACK`).
- `model_confidence` set to `None` unless defensibly scored by model (no hardcoded fake values).

### 3. Dynamic Embeddings & Vector Storage
- `GeminiEmbeddingProvider` (`models/text-embedding-004`).
- **Dynamic Dimension Validation:** `len(vector)` is validated at runtime against expected provider model dimensions. Mismatches raise an explicit `ValueError`.
- **Vector Storage Architecture:** Embeddings are stored as float arrays in `CitizenRequest.embedding_json` (`JSON` column). Similarity operations run in-memory using NumPy/scikit-learn vector math (**Application-Side Vector Similarity**).

### 4. Duplicate Collapse & Data Integrity
- **Exact Duplicates:** Unicode NFKC normalization + whitespace collapse + SHA-256 text hash lookup ($O(1)$).
- **Semantic Duplicates:** Candidate embedding cosine similarity search ($\ge 0.88$ `DEVELOPMENT THRESHOLD`).
- **Data Integrity:** Original citizen submissions are **NEVER deleted**. Linked duplicates get `status = "Merged into Duplicate"`, link `duplicate_of_id`, and `duplicate_count` is updated atomically.
- **Idempotency:** Re-processing the same duplicate checks existing links to prevent duplicate count inflation.

### 5. Semantic Clustering & Lifecycle (`SemanticClusterEngine`)
- **Primary Signal:** Vector embeddings. Category/district do not act as mandatory partitions.
- **Algorithm:** `scikit-learn` DBSCAN operating on cosine distance matrices (`metric='cosine'`).
- **Scalability ($N > 5000$):** Nearest-neighbors sparse graph (`NearestNeighbors(radius=eps, metric='cosine').radius_neighbors_graph(...)`) passed to `DBSCAN(metric='precomputed')`.
- **Noise Handling:** DBSCAN label `-1` represents noise/outliers. Outliers receive `cluster_id = None` and are **NEVER** saved as `RequestCluster(id=-1)`.
- **Counting & Statistics:** Only primary requests (`duplicate_of_id IS NULL`) form cluster centroids. Linked duplicates inherit the primary's `cluster_id`. Metrics track `unique_request_count` (primaries) and `total_request_count` (primaries + duplicates).
- **Stale Cluster Archiving:** Batch reclustering archives active clusters with 0 primary requests (`status = "Archived"`) and archives their linked recommendations.

### 6. Ground-Truth Population Aggregation
- Aggregate locality demographic population from `Demographic.population` linked to distinct affected locations.
- Documented as **`population_of_affected_locations` (locality population proxy)**.
- Missing demographic data $\rightarrow$ `estimated_population = None`. Population is **NEVER** fabricated.

### 7. Deterministic Priority Engine & Grounded Recommendations
- Deterministic 7-Factor mathematical scoring formula with Digital Divide Correction (+N pts).
- LLM recommendation generator synthesizes structured `GroundedRecommendation` cards from verified `evidence_json`.
- **Programmatic Post-Validation:** Python validator checks all numerical figures and referenced entities against `evidence_json`. Recommendations containing unsupported figures are flagged/rejected (`validation_status = "REJECTED_UNSUPPORTED_CLAIMS"`).
