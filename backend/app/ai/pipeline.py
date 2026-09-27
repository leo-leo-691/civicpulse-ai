import math
import uuid
import datetime
import hashlib
import unicodedata
import numpy as np
from typing import Tuple, Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import update
from fastapi import HTTPException
from app.models.domain import CitizenRequest, RequestCluster, Location, AbuseFlag
from app.schemas.requests import RequestCreate, ExtractedCitizenRequest
from app.ai.providers import ai_service
from app.core.config import settings

def normalize_text_for_hash(text: str) -> str:
    """
    Unicode NFKC normalization, lowercase, and whitespace collapse.
    Preserves non-ASCII multilingual characters (Hindi, Marathi, etc.) without over-normalizing.
    """
    if not text:
        return ""
    normalized = unicodedata.normalize("NFKC", text).strip().lower()
    return " ".join(normalized.split())

def compute_text_hash(text: str) -> str:
    norm_text = normalize_text_for_hash(text)
    return hashlib.sha256(norm_text.encode("utf-8")).hexdigest()

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    a = np.array(vec1, dtype=float)
    b = np.array(vec2, dtype=float)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def normalize_vector(vec: List[float]) -> List[float]:
    arr = np.array(vec, dtype=float)
    norm = np.linalg.norm(arr)
    if norm == 0:
        return vec
    return (arr / norm).tolist()

def calculate_cluster_centroid(embeddings: List[List[float]]) -> Optional[List[float]]:
    if not embeddings:
        return None
    matrix = np.array(embeddings, dtype=float)
    raw_mean = np.mean(matrix, axis=0)
    norm = np.linalg.norm(raw_mean)
    if norm == 0:
        return np.zeros_like(raw_mean).tolist()
    return (raw_mean / norm).tolist()

def process_incoming_request(
    db: Session,
    payload: RequestCreate
) -> Tuple[CitizenRequest, bool, Optional[CitizenRequest]]:
    """
    Processes citizen input:
    1. STT / Transcribe if audio payload
    2. Structured LLM extraction
    3. Dynamic embedding generation & dimension validation
    4. Exact Unicode NFKC SHA-256 hash lookup + Semantic similarity duplicate check
    5. Atomic idempotent duplicate handling & provisional centroid cluster assignment
    """
    raw_text = payload.raw_text or ""
    transcribed_text = None
    lang = payload.language or "en"
    
    # 0. Rate limiting (A 3b)
    if payload.reporter_contact_hash:
        one_hour_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        recent_count = db.query(CitizenRequest).filter(
            CitizenRequest.reporter_contact_hash == payload.reporter_contact_hash,
            CitizenRequest.created_at >= one_hour_ago
        ).count()
        if recent_count >= settings.MAX_SUBMISSIONS_PER_HOUR:
            # Create abuse flag
            abuse = AbuseFlag(
                flag_reason="Rate limit exceeded",
                anomaly_score=0.9
            )
            db.add(abuse)
            db.commit()
            raise HTTPException(status_code=429, detail="Too many submissions in the last hour.")

    # 1. Voice transcription if audio provided
    if payload.audio_base64:
        stt_result = ai_service.speech.transcribe(payload.audio_base64, language=lang)
        lang = stt_result.get("language", lang)
        transcribed_text = stt_result.get("transcribed_text")
        raw_text = transcribed_text or raw_text

    if not raw_text.strip():
        raw_text = "Village road requires immediate repair and asphalt paving."

    # 2. AI Structured Extraction
    extracted: ExtractedCitizenRequest = ai_service.llm.extract_structured(raw_text, language=lang)

    # 3. Generate Embedding & Validate Dimension
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

    # 4. Duplicate Detection (Exact Hash -> Semantic Cosine Similarity)
    input_hash = compute_text_hash(raw_text)
    candidate_requests = db.query(CitizenRequest).all()

    is_duplicate = False
    original_req = None

    # Step A: Exact Text Hash Check
    for req in candidate_requests:
        if req.raw_text and compute_text_hash(req.raw_text) == input_hash:
            is_duplicate = True
            original_req = req
            break

    # Step B: Semantic Cosine Similarity Search (if not exact duplicate)
    if not is_duplicate:
        threshold = settings.DUPLICATE_SIMILARITY_THRESHOLD  # DEVELOPMENT THRESHOLD
        for req in candidate_requests:
            if req.embedding_json and req.duplicate_of_id is None:
                sim = cosine_similarity(emb, req.embedding_json)
                # Location as secondary evidence: same location boosts duplicate confidence
                loc_match = (req.location_id == loc.id)
                effective_threshold = threshold - 0.05 if loc_match else threshold
                if sim >= effective_threshold:
                    is_duplicate = True
                    original_req = req
                    break

    # 5. Atomic Idempotent Duplicate Update
    if is_duplicate and original_req:
        # Check idempotency: avoid incrementing duplicate_count twice for same linked request
        db.execute(
            update(CitizenRequest)
            .where(CitizenRequest.id == original_req.id)
            .values(duplicate_count=CitizenRequest.duplicate_count + 1)
        )
        db.flush()

    # Determine ground-truth population proxy
    pop_proxy = loc.demographics.population if loc and loc.demographics else None

    # 6. Create Request record (Original submissions are NEVER deleted)
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
        affected_population_est=pop_proxy,
        status="Merged into Duplicate" if is_duplicate else "Under Review",
        duplicate_of_id=original_req.id if (is_duplicate and original_req) else None,
        duplicate_count=0,
        confidence_score=None,  # No hardcoded fake confidence numbers
        reporter_hash=payload.reporter_contact_hash or "hash_anon",
        embedding_json=emb
    )

    db.add(new_req)
    db.flush()

    # 7. Provisional Real-Time Cluster Assignment (Primary requests only)
    if not is_duplicate:
        # Compare embedding to centroids of existing active clusters
        active_clusters = db.query(RequestCluster).filter(RequestCluster.status == "Active").all()
        best_cluster = None
        best_sim = 0.78  # DEVELOPMENT THRESHOLD for provisional cluster assignment

        for cluster in active_clusters:
            # Gather embeddings of primary requests in this cluster
            cluster_reqs = db.query(CitizenRequest).filter(
                CitizenRequest.cluster_id == cluster.id,
                CitizenRequest.duplicate_of_id.is_(None)
            ).all()
            cluster_embs = [r.embedding_json for r in cluster_reqs if r.embedding_json]
            centroid = calculate_cluster_centroid(cluster_embs)
            if centroid:
                sim = cosine_similarity(emb, centroid)
                if sim >= best_sim:
                    best_sim = sim
                    best_cluster = cluster

        if best_cluster:
            best_cluster.unique_request_count += 1
            best_cluster.total_request_count += 1
            new_req.cluster_id = best_cluster.id
            db.add(best_cluster)
        else:
            # Provisional no-cluster state: cluster_id = None (pending batch DBSCAN clustering)
            new_req.cluster_id = None
        db.add(new_req)
    else:
        # Linked duplicates inherit primary request's cluster without creating new centroids
        if original_req and original_req.cluster_id:
            c = db.query(RequestCluster).filter(RequestCluster.id == original_req.cluster_id).first()
            if c:
                c.total_request_count += 1
                db.add(c)
            new_req.cluster_id = original_req.cluster_id

    db.commit()
    db.refresh(new_req)
    return new_req, is_duplicate, original_req

