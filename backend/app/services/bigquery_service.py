"""
CivicPulse AI — Google Cloud BigQuery Schema & Export Service
Provides BigQuery schema definition, partitioned DDL generation, and JSON batch export
for large-scale national infrastructure demand analysis.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.domain import CitizenRequest, RequestCluster, Location

BIGQUERY_CITIZEN_REQUESTS_SCHEMA = [
    {"name": "reference_code", "type": "STRING", "mode": "REQUIRED", "description": "Unique citizen ticket code"},
    {"name": "timestamp", "type": "TIMESTAMP", "mode": "REQUIRED", "description": "Submission UTC timestamp"},
    {"name": "channel", "type": "STRING", "mode": "NULLABLE", "description": "Submission channel: voice, text, whatsapp, sms"},
    {"name": "language", "type": "STRING", "mode": "NULLABLE", "description": "Detected ISO language code"},
    {"name": "category", "type": "STRING", "mode": "REQUIRED", "description": "Infrastructure domain"},
    {"name": "subcategory", "type": "STRING", "mode": "NULLABLE", "description": "Infrastructure subcategory"},
    {"name": "severity", "type": "STRING", "mode": "NULLABLE", "description": "Severity level"},
    {"name": "urgency", "type": "STRING", "mode": "NULLABLE", "description": "Urgency level"},
    {"name": "district", "type": "STRING", "mode": "NULLABLE", "description": "Administrative district"},
    {"name": "locality", "type": "STRING", "mode": "NULLABLE", "description": "Village or municipal ward"},
    {"name": "latitude", "type": "FLOAT64", "mode": "NULLABLE", "description": "Geocoordinate latitude"},
    {"name": "longitude", "type": "FLOAT64", "mode": "NULLABLE", "description": "Geocoordinate longitude"},
    {"name": "is_duplicate", "type": "BOOL", "mode": "REQUIRED", "description": "Whether duplicate was collapsed"},
    {"name": "duplicate_count", "type": "INT64", "mode": "NULLABLE", "description": "Count of duplicate mentions"},
    {"name": "has_visual_evidence", "type": "BOOL", "mode": "NULLABLE", "description": "Whether photo was analyzed by Gemini Vision"},
    {"name": "visual_severity", "type": "STRING", "mode": "NULLABLE", "description": "Gemini Multimodal damage score"},
    {"name": "cluster_id", "type": "INT64", "mode": "NULLABLE", "description": "Associated hotspot cluster ID"}
]

def export_requests_for_bigquery(db: Session, limit: int = 500) -> List[Dict[str, Any]]:
    """
    Transforms database citizen requests into flat BigQuery-ready JSON objects.
    """
    requests = db.query(CitizenRequest).order_by(CitizenRequest.created_at.desc()).limit(limit).all()
    rows = []

    for r in requests:
        loc = r.location
        vis = r.visual_evidence_json or {}
        rows.append({
            "reference_code": r.reference_code,
            "timestamp": r.created_at.isoformat() if r.created_at else None,
            "channel": r.channel,
            "language": r.language,
            "category": r.category,
            "subcategory": r.subcategory,
            "severity": r.severity,
            "urgency": r.urgency,
            "district": loc.district if loc else None,
            "locality": loc.locality if loc else None,
            "latitude": loc.latitude if loc else None,
            "longitude": loc.longitude if loc else None,
            "is_duplicate": r.duplicate_of_id is not None,
            "duplicate_count": r.duplicate_count,
            "has_visual_evidence": bool(r.image_data or r.visual_evidence_json),
            "visual_severity": vis.get("damage_severity"),
            "cluster_id": r.cluster_id
        })

    return rows

def get_bigquery_ddl() -> str:
    """
    Generates standard BigQuery DDL table creation statement.
    """
    return """
    CREATE OR REPLACE TABLE `civicpulse_analytics.national_citizen_requests` (
        reference_code STRING NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        channel STRING,
        language STRING,
        category STRING NOT NULL,
        subcategory STRING,
        severity STRING,
        urgency STRING,
        district STRING,
        locality STRING,
        latitude FLOAT64,
        longitude FLOAT64,
        is_duplicate BOOL NOT NULL,
        duplicate_count INT64,
        has_visual_evidence BOOL,
        visual_severity STRING,
        cluster_id INT64
    )
    PARTITION BY DATE(timestamp)
    CLUSTER BY district, category;
    """.strip()
