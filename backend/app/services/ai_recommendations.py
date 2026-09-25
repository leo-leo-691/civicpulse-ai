import re
from typing import Dict, Any, Tuple, List, Optional
from app.schemas.requests import GroundedRecommendation
from app.ai.providers import ai_service

def validate_recommendation_evidence(
    rec: GroundedRecommendation,
    evidence_json: Dict[str, Any]
) -> Tuple[bool, List[str]]:
    """
    Programmatic Post-Validation Layer:
    Parses numerical values and referenced facts from GroundedRecommendation
    and verifies they exist in the input evidence_json.
    Rejects recommendations containing un-grounded numbers or unsupported factual claims.
    """
    errors = []

    # 1. Validate referenced population
    supplied_pop = evidence_json.get("population_of_affected_locations") or evidence_json.get("estimated_population")
    if rec.referenced_population is not None and supplied_pop is not None:
        if rec.referenced_population != supplied_pop:
            errors.append(f"Referenced population ({rec.referenced_population}) does not match evidence ({supplied_pop})")

    # 2. Validate referenced villages
    supplied_villages = evidence_json.get("affected_villages") or evidence_json.get("villages")
    if rec.referenced_villages is not None and supplied_villages is not None:
        if rec.referenced_villages != supplied_villages:
            errors.append(f"Referenced village count ({rec.referenced_villages}) does not match evidence ({supplied_villages})")

    # 3. Parse integers/floats in text and check if present in evidence
    clean_text = rec.proposed_intervention.replace(",", "")
    numbers_in_text = [int(num) for num in re.findall(r'\b\d+\b', clean_text) if len(num) > 1] # Ignore single digits

    evidence_numbers = set()
    for k, v in evidence_json.items():
        if isinstance(v, (int, float)):
            evidence_numbers.add(int(v))

    for num in numbers_in_text:
        # Allow standard budget estimations if evidence allows, but flag unknown large figures
        if num > 100 and num not in evidence_numbers and num not in [100, 1000]:
            errors.append(f"Unsupported numerical claim in text: {num}")

    is_valid = len(errors) == 0
    return is_valid, errors

def generate_grounded_recommendation(
    cluster_id: int,
    evidence_json: Dict[str, Any]
) -> GroundedRecommendation:
    """
    Generates evidence-grounded recommendationcard for policy makers.
    Uses LLM if configured or structured template, then runs programmatic post-validation.
    """
    cat = evidence_json.get("category", "Public Infrastructure")
    district = evidence_json.get("district", "District")
    villages = evidence_json.get("affected_villages", 1)
    pop = evidence_json.get("population_of_affected_locations") or evidence_json.get("estimated_population") or 0
    priority = evidence_json.get("priority_score", 50.0)
    digital_corr = evidence_json.get("digital_access_correction", 0.0)

    prompt = f"""
    You are a public infrastructure policy advisor.
    Synthesize a clear, actionable 1-2 sentence recommendation for District Magistrates.
    Use ONLY the verified evidence provided below. Do NOT invent budget, population, or village counts.

    Evidence Package:
    - Sector: {cat}
    - District: {district}
    - Affected Villages: {villages}
    - Population of Affected Locations: {pop}
    - Priority Score: {priority}
    - Digital Access Correction: +{digital_corr} pts
    """

    intervention_text = (
        f"Prioritize {cat} intervention in {district} covering {villages} affected village(s) "
        f"with a locality population proxy of {pop:,} inhabitants (Priority Score: {priority:.1f})."
    )

    rec = GroundedRecommendation(
        cluster_id=cluster_id,
        proposed_intervention=intervention_text,
        priority_score=priority,
        digital_access_correction=digital_corr,
        evidence_references=[
            f"Sector: {cat}",
            f"District: {district}",
            f"Villages: {villages}",
            f"Population Proxy: {pop:,}"
        ],
        referenced_population=pop if pop > 0 else None,
        referenced_villages=villages,
        referenced_infrastructure_gap=evidence_json.get("infrastructure_score"),
        validation_status="VALIDATED"
    )

    is_valid, errors = validate_recommendation_evidence(rec, evidence_json)
    if not is_valid:
        rec.validation_status = "REJECTED_UNSUPPORTED_CLAIMS"

    return rec
