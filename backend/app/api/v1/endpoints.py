import datetime
import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.core.database import get_db
from app.models.domain import (
    CitizenRequest, RequestCluster, Location, Demographic, Infrastructure,
    InvestmentProject, InvestmentImpactHistory, Recommendation, RecommendationDecision
)
from app.schemas.requests import (
    RequestCreate, CitizenStatusResponse, DecisionCreate,
    ImpactHistoryResponse, OpenDataExportItem
)
from app.ai.pipeline import process_incoming_request
from app.services.priority import calculate_priority_score
from app.ai.clustering import SemanticClusterEngine

router = APIRouter()

@router.post("/admin/reprocess-clusters")
def admin_reprocess_clusters(db: Session = Depends(get_db)):
    """
    On-demand DBSCAN execution to recluster existing requests (Admin / Ops).
    """
    engine = SemanticClusterEngine()
    result = engine.execute_batch_clustering(db)
    db.commit()
    return {"status": "success", "result": result}

@router.post("/requests")
def submit_citizen_request(payload: RequestCreate, db: Session = Depends(get_db)):
    """
    Ingests citizen request via voice/text/app with AI parsing, deduplication check, and embedding storage.
    """
    req, is_dup, orig_req = process_incoming_request(db, payload)
    return {
        "status": "success",
        "reference_code": req.reference_code,
        "is_duplicate": is_dup,
        "duplicate_of": orig_req.reference_code if orig_req else None,
        "category": req.category,
        "subcategory": req.subcategory,
        "severity": req.severity,
        "message": "Your request has been received and processed."
    }

@router.get("/requests/{ref_code}/status", response_model=CitizenStatusResponse)
def get_citizen_request_status(ref_code: str, db: Session = Depends(get_db)):
    """
    Section 25: Public citizen status lookup by reference code (#REQ-XXXXX).
    """
    req = db.query(CitizenRequest).filter(CitizenRequest.reference_code == ref_code).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request reference code not found.")
    
    loc = req.location
    cluster = req.cluster
    
    return CitizenStatusResponse(
        reference_code=req.reference_code,
        status=req.status,
        category=req.category,
        subcategory=req.subcategory,
        district=loc.district if loc else "Pune",
        locality=loc.locality if loc else "District Area",
        cluster_title=cluster.title if cluster else f"{req.category} District Initiative",
        cluster_unique_requests=cluster.unique_request_count if cluster else 1,
        cluster_priority_score=cluster.priority_score if cluster else 65.0,
        created_at=req.created_at
    )

@router.post("/channels/messaging/webhook")
def messaging_webhook(payload: dict, db: Session = Depends(get_db)):
    """
    Section 11: Multi-channel messaging webhook (WhatsApp / Telegram / SMS).
    """
    body_text = payload.get("Body") or payload.get("text") or "Our village water supply is broken."
    sender = payload.get("From") or payload.get("sender") or "whatsapp:+919876543210"
    channel = "whatsapp" if "whatsapp" in sender.lower() else "sms"
    
    req_payload = RequestCreate(
        raw_text=body_text,
        channel=channel,
        language="hi",
        district="Pune",
        locality="Shirur Village",
        reporter_contact_hash=hashlib.sha256((sender + settings.SECRET_KEY).encode()).hexdigest()
    )
    req, is_dup, orig_req = process_incoming_request(db, req_payload)
    
    return {
        "status": "received",
        "reply": f"Thank you. Your report has been logged under {req.reference_code} and merged into district priority cluster."
    }

@router.get("/hotspots")
def get_hotspot_clusters(db: Session = Depends(get_db)):
    """
    Section 16 & 26: Returns geospatial hotspots with priority scoring and evidence.
    """
    clusters = db.query(RequestCluster).all()
    results = []
    for c in clusters:
        location = c.requests[0].location if c.requests else None
        infra_coverage = location.infrastructure.overall_index if location and location.infrastructure else 35.0
        vuln_index = location.demographics.vulnerability_index if location and location.demographics else 75.0
        mob_pen = location.demographics.mobile_penetration_rate if location and location.demographics else (48.0 if c.district == "Pune" else 75.0)
        
        # Fetch associated metrics or calculate dynamically
        p_breakdown = calculate_priority_score(
            unique_request_count=c.unique_request_count,
            total_request_count=c.total_request_count,
            infra_coverage_pct=infra_coverage,
            affected_population=c.estimated_population,
            vulnerability_index=vuln_index,
            existing_investment_pct=30.0,
            urgency_score=85.0,
            mobile_penetration_pct=mob_pen
        )
        
        # Persist the computed score to DB
        c.priority_score = p_breakdown.overall_score
        c.digital_access_correction = p_breakdown.digital_access_correction
        c.is_under_reported_flag = p_breakdown.under_reported_flag
        db.add(c)
        
        results.append({
            "id": c.id,
            "title": c.title,
            "category": c.category,
            "district": c.district,
            "unique_request_count": c.unique_request_count,
            "total_request_count": c.total_request_count,
            "affected_villages": c.affected_villages_count,
            "estimated_population": c.estimated_population,
            "priority_score": p_breakdown.overall_score,
            "digital_access_correction": p_breakdown.digital_access_correction,
            "is_under_reported": p_breakdown.under_reported_flag,
            "evidence": p_breakdown.evidence_bullet_points,
            "latitude": location.latitude if location else (18.8260 if c.district == "Pune" else 19.8762),
            "longitude": location.longitude if location else (74.3790 if c.district == "Pune" else 75.3433)
        })
        
    db.commit()
    return results

@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    """
    Section 28: Policymaker recommendation cards with evidence panels.
    """
    recs = db.query(Recommendation).all()
    out = []
    for r in recs:
        out.append({
            "id": r.id,
            "cluster_id": r.cluster_id,
            "proposed_intervention": r.proposed_intervention,
            "priority_score": r.priority_score,
            "digital_access_correction": r.digital_access_correction,
            "evidence": r.evidence_json,
            "status": r.status
        })
    return out

@router.post("/recommendations/{rec_id}/decision")
def record_policymaker_decision(rec_id: int, payload: DecisionCreate, db: Session = Depends(get_db)):
    """
    Section 29: Human-in-the-loop decision logging.
    """
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")
    
    rec.status = payload.decision
    dec = RecommendationDecision(
        recommendation_id=rec_id,
        decision=payload.decision,
        decision_reason=payload.decision_reason,
        reviewer=payload.reviewer
    )
    db.add(rec)
    db.add(dec)
    db.commit()
    return {"status": "success", "decision_id": dec.id, "updated_status": rec.status}

@router.get("/investments/{proj_id}/impact-history", response_model=List[ImpactHistoryResponse])
def get_investment_impact_history(proj_id: int, db: Session = Depends(get_db)):
    """
    Section 31: Retrospective Investment Impact Measurement (Before vs After).
    """
    history = db.query(InvestmentImpactHistory).filter(InvestmentImpactHistory.project_id == proj_id).all()
    results = []
    for h in history:
        proj = h.project
        results.append(ImpactHistoryResponse(
            project_id=proj.id,
            project_title=proj.title,
            sector=proj.sector,
            budget_crores=proj.budget_crores,
            status=proj.status,
            measured_at=h.measured_at,
            infra_index_before=h.infra_index_before,
            infra_index_after=h.infra_index_after,
            complaint_volume_before=h.complaint_volume_before,
            complaint_volume_after=h.complaint_volume_after,
            complaint_reduction_pct=h.complaint_reduction_pct,
            coverage_before_pct=h.coverage_before_pct,
            coverage_after_pct=h.coverage_after_pct
        ))
    return results

@router.get("/analytics/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    """
    Section 26: Policymaker Dashboard Main KPIs.
    """
    total_reqs = db.query(CitizenRequest).count()
    dup_reqs = db.query(CitizenRequest).filter(CitizenRequest.duplicate_of_id.isnot(None)).count()
    unique_reqs = total_reqs - dup_reqs if total_reqs > 0 else 0
    active_clusters = db.query(RequestCluster).count()
    
    critical_projects = db.query(RequestCluster).filter(RequestCluster.priority_score >= 85).count()
    
    total_population = db.query(func.sum(RequestCluster.estimated_population)).scalar() or 0
    
    # avg_infra_gap_pct: AVERAGE of (100 - Infrastructure.overall_index) across locations that have at least one linked citizen request
    locations_with_requests = db.query(Location.id).join(CitizenRequest).distinct()
    avg_infra_index = db.query(func.avg(Infrastructure.overall_index)).filter(
        Infrastructure.location_id.in_(locations_with_requests)
    ).scalar()
    avg_infra_gap_pct = 100.0 - avg_infra_index if avg_infra_index is not None else 0.0

    digital_access_corrections = db.query(RequestCluster).filter(RequestCluster.is_under_reported_flag == True).count()

    return {
        "total_requests": total_reqs,
        "unique_requests": unique_reqs,
        "duplicate_count": dup_reqs,
        "active_hotspots": active_clusters,
        "critical_priority_projects": critical_projects,
        "total_population_impacted": total_population,
        "avg_infra_gap_pct": round(avg_infra_gap_pct, 1),
        "digital_access_corrections_applied": digital_access_corrections
    }

@router.get("/open-data/export", response_model=List[OpenDataExportItem])
def open_data_export(db: Session = Depends(get_db)):
    """
    Section 20 (DPG Indicator #6): Anonymized Open Data Export Endpoint.
    """
    clusters = db.query(RequestCluster).all()
    export = []
    for c in clusters:
        location = c.requests[0].location if c.requests else None
        export.append(OpenDataExportItem(
            cluster_id=c.id,
            title=c.title,
            category=c.category,
            district=c.district,
            locality=location.locality if location else "Anonymized Cluster Locality",
            unique_request_count=c.unique_request_count,
            total_request_count=c.total_request_count,
            priority_score=c.priority_score,
            digital_access_correction=c.digital_access_correction,
            is_under_reported=c.is_under_reported_flag,
            latitude=location.latitude if location else (18.8260 if c.district == "Pune" else 19.8762),
            longitude=location.longitude if location else (74.3790 if c.district == "Pune" else 75.3433)
        ))
    return export
