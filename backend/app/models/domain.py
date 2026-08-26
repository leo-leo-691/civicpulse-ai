import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    country = Column(String, default="India", index=True)
    state = Column(String, default="Maharashtra", index=True)
    district = Column(String, index=True)
    subdistrict = Column(String, nullable=True)
    locality = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    requests = relationship("CitizenRequest", back_populates="location")
    demographics = relationship("Demographic", back_populates="location", uselist=False)
    infrastructure = relationship("Infrastructure", back_populates="location", uselist=False)
    investment_projects = relationship("InvestmentProject", back_populates="location")

class Demographic(Base):
    __tablename__ = "demographics"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    population = Column(Integer, default=50000)
    density = Column(Float, default=450.0)
    vulnerability_index = Column(Float, default=65.0) # 0-100
    literacy_rate = Column(Float, default=72.0)
    mobile_penetration_rate = Column(Float, default=55.0) # Used for digital divide index
    internet_penetration_rate = Column(Float, default=40.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    location = relationship("Location", back_populates="demographics")

class Infrastructure(Base):
    __tablename__ = "infrastructure"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    overall_index = Column(Float, default=50.0) # 0-100 (lower = higher gap)
    road_coverage_pct = Column(Float, default=45.0)
    water_coverage_pct = Column(Float, default=35.0)
    health_facility_density = Column(Float, default=40.0)
    electricity_reliability_pct = Column(Float, default=60.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    location = relationship("Location", back_populates="infrastructure")

class CitizenRequest(Base):
    __tablename__ = "citizen_requests"

    id = Column(Integer, primary_key=True, index=True)
    reference_code = Column(String, unique=True, index=True) # #REQ-48213
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    channel = Column(String, default="text") # text, voice, whatsapp, sms, telegram
    language = Column(String, default="en") # en, hi, mr, pt
    raw_text = Column(Text)
    transcribed_text = Column(Text, nullable=True)
    translated_text = Column(Text, nullable=True)
    category = Column(String, index=True) # Road, Water, Health, Education, Electricity
    subcategory = Column(String)
    severity = Column(String, default="medium") # low, medium, high, critical
    urgency = Column(String, default="medium")
    
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    affected_population_est = Column(Integer, default=100)
    status = Column(String, default="Under Review") # Received, Under Review, Merged, Actioned
    
    cluster_id = Column(Integer, ForeignKey("request_clusters.id"), nullable=True)
    duplicate_of_id = Column(Integer, ForeignKey("citizen_requests.id"), nullable=True)
    duplicate_count = Column(Integer, default=0)
    
    confidence_score = Column(Float, default=0.92)
    reporter_hash = Column(String, nullable=True, index=True)
    embedding_json = Column(JSON, nullable=True) # Fallback stored embedding vector
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    location = relationship("Location", back_populates="requests")
    cluster = relationship("RequestCluster", back_populates="requests")

class RequestCluster(Base):
    __tablename__ = "request_clusters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    category = Column(String, index=True)
    subcategory = Column(String)
    district = Column(String, index=True)
    unique_request_count = Column(Integer, default=1)
    total_request_count = Column(Integer, default=1) # includes duplicates
    affected_villages_count = Column(Integer, default=1)
    estimated_population = Column(Integer, default=1000)
    priority_score = Column(Float, default=50.0)
    digital_access_correction = Column(Float, default=0.0) # +N correction boost
    is_under_reported_flag = Column(Boolean, default=False)
    status = Column(String, default="Open")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    requests = relationship("CitizenRequest", back_populates="cluster")
    recommendations = relationship("Recommendation", back_populates="cluster")

class InvestmentProject(Base):
    __tablename__ = "investment_projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    sector = Column(String, index=True)
    budget_crores = Column(Float)
    location_id = Column(Integer, ForeignKey("locations.id"))
    status = Column(String, default="In Progress") # Proposed, In Progress, Completed
    start_date = Column(DateTime, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    existing_coverage_pct = Column(Float, default=30.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    location = relationship("Location", back_populates="investment_projects")
    impact_history = relationship("InvestmentImpactHistory", back_populates="project")

class InvestmentImpactHistory(Base):
    __tablename__ = "investment_impact_history"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("investment_projects.id"))
    measured_at = Column(DateTime, default=datetime.datetime.utcnow)
    infra_index_before = Column(Float)
    infra_index_after = Column(Float)
    complaint_volume_before = Column(Integer)
    complaint_volume_after = Column(Integer)
    complaint_reduction_pct = Column(Float)
    coverage_before_pct = Column(Float)
    coverage_after_pct = Column(Float)

    project = relationship("InvestmentProject", back_populates="impact_history")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("request_clusters.id"))
    proposed_intervention = Column(Text)
    priority_score = Column(Float) # 0-100
    digital_access_correction = Column(Float, default=0.0)
    evidence_json = Column(JSON) # Detailed evidence breakdown per §8
    status = Column(String, default="Pending Decision") # Pending Decision, Approved, Rejected

    cluster = relationship("RequestCluster", back_populates="recommendations")
    decisions = relationship("RecommendationDecision", back_populates="recommendation")

class RecommendationDecision(Base):
    __tablename__ = "recommendation_decisions"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"))
    decision = Column(String) # Approved, Rejected, Flagged, Needs Analysis
    decision_reason = Column(Text)
    reviewer = Column(String, default="District Magistrate")
    decided_at = Column(DateTime, default=datetime.datetime.utcnow)

    recommendation = relationship("Recommendation", back_populates="decisions")

class AbuseFlag(Base):
    __tablename__ = "abuse_flags"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("citizen_requests.id"), nullable=True)
    cluster_id = Column(Integer, ForeignKey("request_clusters.id"), nullable=True)
    flag_reason = Column(String)
    anomaly_score = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
