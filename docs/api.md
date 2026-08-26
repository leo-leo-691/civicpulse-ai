# CivicPulse AI — API Documentation

Base Endpoint: `/api/v1`

---

## Endpoint Summary

### 1. Ingestion & Webhooks
- `POST /api/v1/requests`: Submit citizen text or voice request.
- `POST /api/v1/channels/messaging/webhook`: Multi-channel webhook receiver for WhatsApp, SMS, and Telegram.

### 2. Status Tracking & Open Data
- `GET /api/v1/requests/{ref_code}/status`: Public status lookup for citizens using reference code `#REQ-XXXXX`.
- `GET /api/v1/open-data/export`: Anonymized GeoJSON / CSV open data export endpoint.

### 3. Intelligence & Analytics
- `GET /api/v1/hotspots`: Returns geospatial demand clusters with priority score breakdowns.
- `GET /api/v1/recommendations`: Policy intervention recommendations with evidence panels.
- `POST /api/v1/recommendations/{id}/decision`: Record human-in-the-loop decision logs.
- `GET /api/v1/investments/{id}/impact-history`: Retrospective pre- vs. post-project infrastructure impact measurements.
- `GET /api/v1/analytics/overview`: Dashboard summary KPIs.
