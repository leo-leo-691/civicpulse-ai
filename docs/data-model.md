# CivicPulse AI — Data Model & Schema Reference

Database Engine: PostgreSQL 16 + PostGIS + pgvector

---

## Key Entities & Relationships

### 1. `locations`
- `id`: Primary key
- `country`: Country name (Default: India)
- `state`: State/Province name (Default: Maharashtra)
- `district`: District name (Index)
- `locality`: Village/Locality name (Index)
- `latitude`, `longitude`: Geospatial coordinates

### 2. `demographics`
- `id`: Primary key
- `location_id`: Foreign key to `locations`
- `population`: Total inhabitants
- `vulnerability_index`: Vulnerability score (0-100)
- `literacy_rate`: Literacy percentage
- `mobile_penetration_rate`: Used for Section 7 Digital Access Correction

### 3. `infrastructure`
- `id`: Primary key
- `location_id`: Foreign key to `locations`
- `overall_index`: Infrastructure coverage score (0-100, lower = higher gap)
- `road_coverage_pct`, `water_coverage_pct`

### 4. `citizen_requests`
- `id`: Primary key
- `reference_code`: Public lookup code `#REQ-XXXXX`
- `channel`: text, voice, whatsapp, sms, telegram
- `language`: en, hi, mr, pt
- `raw_text`, `transcribed_text`, `translated_text`
- `category`, `subcategory`, `severity`, `urgency`
- `duplicate_of_id`: Foreign key to original request if duplicate
- `duplicate_count`: Incremented when duplicate resubmissions occur

### 5. `request_clusters`
- `id`: Primary key
- `title`, `category`, `district`
- `unique_request_count`, `total_request_count`
- `priority_score`: Calculated by Priority Engine (0-100)
- `digital_access_correction`: Upward score correction (+N pts)
- `is_under_reported_flag`: Boolean flag for low connectivity regions

### 6. `investment_impact_history` (Section 31 Retrospective Impact)
- `id`: Primary key
- `project_id`: Foreign key to `investment_projects`
- `measured_at`: Timestamp of measurement
- `infra_index_before`, `infra_index_after`
- `complaint_volume_before`, `complaint_volume_after`
- `complaint_reduction_pct`
