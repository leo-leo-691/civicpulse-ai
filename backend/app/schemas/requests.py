from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Pydantic Schema for AI Structured Extraction (§5 & §32 Prompt Injection Defense) ---

class ExtractedCitizenRequest(BaseModel):
    category: str = Field(..., description="Primary category: Road Infrastructure, Water, Health, Education, Electricity, Public Transport")
    subcategory: str = Field(..., description="Subcategory: e.g. Drinking Water, Rural Road Connectivity, School Infrastructure")
    severity: str = Field(..., description="Severity level: low, medium, high, critical")
    urgency: str = Field(..., description="Urgency level: low, medium, high, critical")
    affected_groups: List[str] = Field(default_factory=list, description="Groups affected, e.g. children, elderly, farmers")
    issue_summary: str = Field(..., description="Clean concise summary of the issue")
    potential_impact: str = Field(..., description="Impact on community")
    location_mentions: List[str] = Field(default_factory=list, description="Mentioned villages, districts, or landmarks")

# --- API Endpoints Request / Response Schemas ---

class RequestCreate(BaseModel):
    raw_text: Optional[str] = None
    audio_base64: Optional[str] = None
    channel: str = Field(default="text", description="text, voice, whatsapp, sms, telegram")
    language: Optional[str] = Field(default="en", description="ISO code: en, hi, mr, pt")
    district: Optional[str] = "Pune"
    locality: Optional[str] = "Shirur Village"
    latitude: Optional[float] = 18.8260
    longitude: Optional[float] = 74.3790
    reporter_contact_hash: Optional[str] = None

class CitizenStatusResponse(BaseModel):
    reference_code: str
    status: str
    category: str
    subcategory: str
    district: str
    locality: str
    cluster_title: Optional[str] = None
    cluster_unique_requests: int = 1
    cluster_priority_score: Optional[float] = None
    created_at: datetime

class DecisionCreate(BaseModel):
    decision: str = Field(..., description="Approved, Rejected, Flagged, Needs Analysis")
    decision_reason: str
    reviewer: str = "District Officer"

class PriorityBreakdown(BaseModel):
    citizen_demand: float
    infrastructure_gap: float
    population_impact: float
    vulnerability: float
    investment_gap: float
    urgency: float
    digital_access_correction: float
    under_reported_flag: bool
    overall_score: float
    evidence_bullet_points: List[str]

class ImpactHistoryResponse(BaseModel):
    project_id: int
    project_title: str
    sector: str
    budget_crores: float
    status: str
    measured_at: datetime
    infra_index_before: float
    infra_index_after: float
    complaint_volume_before: int
    complaint_volume_after: int
    complaint_reduction_pct: float
    coverage_before_pct: float
    coverage_after_pct: float

class OpenDataExportItem(BaseModel):
    cluster_id: int
    title: str
    category: str
    district: str
    locality: str
    unique_request_count: int
    total_request_count: int
    priority_score: float
    digital_access_correction: float
    is_under_reported: bool
    latitude: float
    longitude: float
