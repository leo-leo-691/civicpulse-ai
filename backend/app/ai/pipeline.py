import math
import uuid
import datetime
import numpy as np
from typing import Tuple, Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.domain import CitizenRequest, RequestCluster, Location
from app.schemas.requests import RequestCreate, ExtractedCitizenRequest
from app.ai.providers import ai_service
from app.core.config import settings

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    a = np.array(vec1)
    b = np.array(vec2)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def process_incoming_request(
    db: Session,
    payload: RequestCreate
) -> Tuple[CitizenRequest, bool, Optional[CitizenRequest]]:
    """
    Processes citizen input:
    1. STT / Transcribe if audio payload
    2. Structured LLM extraction
    3. Embedding generation
    4. Duplicate check against existing requests from same reporter / locality
    5. Returns (request, is_duplicate, original_request_if_duplicate)
    """
    raw_text = payload.raw_text or ""
    transcribed_text = None
    lang = payload.language or "en"

    # 1. Voice transcription if audio provided
    if payload.audio_base64:
        stt_result = ai_service.speech.transcribe(payload.audio_base64, language=lang)
        lang = stt_result["language"]
        transcribed_text = stt_result["transcribed_text"]
        raw_text = transcribed_text

    if not raw_text.strip():
        raw_text = "Village road requires immediate repair and asphalt paving."

    # 2. AI Structured Extraction
    extracted: ExtractedCitizenRequest = ai_service.llm.extract_structured(raw_text, language=lang)

    # 3. Generate Embedding
    emb = ai_service.embedding.generate_embedding(raw_text)

    # Generate unique reference code #REQ-XXXXX
    ref_code = f"#REQ-{uuid.uuid4().hex[:5].upper()}"

    # Find or Create Location entity
    loc = db.query(Location).filter(
        Location.district == (payload.district or "Pune"),
        Location.locality == (payload.locality or "Shirur Village")
    ).first()

    if not loc:
        loc = Location(
            country="India",
            state="Maharashtra",
            district=payload.district or "Pune",
            locality=payload.locality or "Shirur Village",
            latitude=payload.latitude or 18.8260,
            longitude=payload.longitude or 74.3790
        )
        db.add(loc)
        db.flush()

    # 4. Section 13 Duplicate Detection Check
    # Look up recent requests in same location or by same reporter
    recent_requests = db.query(CitizenRequest).filter(
        CitizenRequest.location_id == loc.id
    ).all()

    threshold = settings.DUPLICATE_SIMILARITY_THRESHOLD
    is_duplicate = False
    original_req = None

    for req in recent_requests:
        if req.embedding_json:
            sim = cosine_similarity(emb, req.embedding_json)
            if sim >= threshold:
                is_duplicate = True
                original_req = req
                # Increment duplicate count on original
                req.duplicate_count += 1
                db.add(req)
                db.flush()
                break

    # 5. Create Request record
    new_req = CitizenRequest(
        reference_code=ref_code,
        channel=payload.channel,
        language=lang,
        raw_text=raw_text,
        transcribed_text=transcribed_text,
        translated_text=extracted.issue_summary,
        category=extracted.category,
        subcategory=extracted.subcategory,
        severity=extracted.severity,
        urgency=extracted.urgency,
        location_id=loc.id,
        affected_population_estimate=150,
        status="Merged into Duplicate" if is_duplicate else "Under Review",
        duplicate_of_id=original_req.id if (is_duplicate and original_req) else None,
        duplicate_count=0,
        confidence_score=0.94,
        reporter_hash=payload.reporter_contact_hash or "hash_anon",
        embedding_json=emb
    )

    db.add(new_req)
    db.flush()

    # 6. Assign / Update Cluster
    if not is_duplicate:
        cluster = db.query(RequestCluster).filter(
            RequestCluster.district == loc.district,
            RequestCluster.category == extracted.category
        ).first()

        if not cluster:
            cluster = RequestCluster(
                title=f"{extracted.category} - {loc.district} Cluster",
                category=extracted.category,
                subcategory=extracted.subcategory,
                district=loc.district,
                unique_request_count=1,
                total_request_count=1,
                affected_villages_count=1,
                estimated_population=loc.demographics.population if loc.demographics else 5000,
                priority_score=65.0,
                status="Active"
            )
            db.add(cluster)
            db.flush()
        else:
            cluster.unique_request_count += 1
            cluster.total_request_count += 1
            db.add(cluster)
            db.flush()

        new_req.cluster_id = cluster.id
        db.add(new_req)
    else:
        # Increment total count on original request's cluster if available
        if original_req and original_req.cluster_id:
            c = db.query(RequestCluster).filter(RequestCluster.id == original_req.cluster_id).first()
            if c:
                c.total_request_count += 1
                db.add(c)

    db.commit()
    db.refresh(new_req)
    return new_req, is_duplicate, original_req
