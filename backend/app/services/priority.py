from typing import Dict, Any, List, Tuple
from app.schemas.requests import PriorityBreakdown

def calculate_priority_score(
    unique_request_count: int,
    total_request_count: int,
    infra_coverage_pct: float,        # 0-100 (lower = higher gap)
    affected_population: int,
    vulnerability_index: float,       # 0-100
    existing_investment_pct: float,   # 0-100 (lower = higher gap)
    urgency_score: float,             # 0-100
    mobile_penetration_pct: float     # 0-100 (digital access metric)
) -> PriorityBreakdown:
    """
    Section 7 Deterministic Priority Engine with Digital-Divide Correction.
    All factors normalized to 0–100.
    """
    # 1. Citizen Demand Score (0-100) based on unique request volume
    demand_score = min(100.0, (unique_request_count / 50.0) * 100.0)

    # 2. Infrastructure Gap Score (0-100) -> Inverse of coverage
    infra_gap_score = max(0.0, 100.0 - infra_coverage_pct)

    # 3. Population Impact Score (0-100)
    pop_score = min(100.0, (affected_population / 25000.0) * 100.0)

    # 4. Vulnerability Score (0-100)
    vuln_score = min(100.0, max(0.0, vulnerability_index))

    # 5. Investment Gap Score (0-100) -> Inverse of existing investment
    invest_gap_score = max(0.0, 100.0 - existing_investment_pct)

    # 6. Urgency Score (0-100)
    urgency_val = min(100.0, max(0.0, urgency_score))

    # Weighted Base Score (0-100)
    base_score = (
        (demand_score * 0.25) +
        (infra_gap_score * 0.20) +
        (pop_score * 0.15) +
        (vuln_score * 0.15) +
        (invest_gap_score * 0.10) +
        (urgency_val * 0.10)
    )

    # 7. Section 7 Digital-Access Correction Mechanism
    # High infrastructure gap + low mobile/digital penetration = severe under-reporting risk
    digital_access_correction = 0.0
    under_reported_flag = False

    if infra_gap_score >= 60.0 and mobile_penetration_pct <= 55.0:
        # Region has severe needs but low connectivity to report them
        digital_access_correction = round(min(12.0, (60.0 - mobile_penetration_pct) * 0.3 + 5.0), 1)
        under_reported_flag = True

    overall_score = round(min(100.0, base_score + digital_access_correction), 1)

    # Synthesize evidence bullets (§8)
    evidence = [
        f"{total_request_count:,} total citizen requests ({unique_request_count:,} unique post-deduplication)",
        f"Estimated affected population: {affected_population:,}",
        f"Infrastructure coverage score: {infra_coverage_pct:.1f}/100 (Gap: {infra_gap_score:.1f}/100)",
        f"Existing investment coverage: {existing_investment_pct:.1f}%",
        f"Regional vulnerability index: {vuln_score:.1f}/100"
    ]

    if under_reported_flag:
        evidence.append(
            f"Digital-Access Index: {mobile_penetration_pct:.1f}/100 (below threshold) → "
            f"+{digital_access_correction} point correction applied; flagged for offline field verification."
        )

    return PriorityBreakdown(
        citizen_demand=round(demand_score, 1),
        infrastructure_gap=round(infra_gap_score, 1),
        population_impact=round(pop_score, 1),
        vulnerability=round(vuln_score, 1),
        investment_gap=round(invest_gap_score, 1),
        urgency=round(urgency_val, 1),
        digital_access_correction=digital_access_correction,
        under_reported_flag=under_reported_flag,
        overall_score=overall_score,
        evidence_bullet_points=evidence
    )
