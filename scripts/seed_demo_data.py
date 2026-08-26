import os
import sys
import datetime

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.database import SessionLocal, engine, Base
from app.models.domain import (
    Location, Demographic, Infrastructure, CitizenRequest,
    RequestCluster, InvestmentProject, InvestmentImpactHistory,
    Recommendation, RecommendationDecision
)

def seed_database():
    print("Seeding CivicPulse AI Demo Data...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing data
        db.query(RecommendationDecision).delete()
        db.query(Recommendation).delete()
        db.query(InvestmentImpactHistory).delete()
        db.query(InvestmentProject).delete()
        db.query(CitizenRequest).delete()
        db.query(RequestCluster).delete()
        db.query(Infrastructure).delete()
        db.query(Demographic).delete()
        db.query(Location).delete()
        db.commit()

        # 1. Locations
        loc1 = Location(
            country="India", state="Maharashtra", district="Pune",
            locality="Shirur Taluka", latitude=18.8260, longitude=74.3790
        )
        loc2 = Location(
            country="India", state="Maharashtra", district="Gadchiroli",
            locality="Bhamragad Block", latitude=19.8762, longitude=75.3433
        )
        db.add_all([loc1, loc2])
        db.flush()

        # 2. Demographics (Gadchiroli has low mobile penetration: 38% -> triggers Digital Divide Correction!)
        demo1 = Demographic(
            location_id=loc1.id, population=120000, density=350.0,
            vulnerability_index=45.0, literacy_rate=82.0, mobile_penetration_rate=78.0, internet_penetration_rate=65.0
        )
        demo2 = Demographic(
            location_id=loc2.id, population=42800, density=110.0,
            vulnerability_index=82.0, literacy_rate=54.0, mobile_penetration_rate=38.0, internet_penetration_rate=22.0
        )
        db.add_all([demo1, demo2])
        db.flush()

        # 3. Infrastructure
        infra1 = Infrastructure(
            location_id=loc1.id, overall_index=65.0, road_coverage_pct=70.0, water_coverage_pct=60.0, health_facility_density=68.0
        )
        infra2 = Infrastructure(
            location_id=loc2.id, overall_index=32.0, road_coverage_pct=25.0, water_coverage_pct=18.0, health_facility_density=28.0
        )
        db.add_all([infra1, infra2])
        db.flush()

        # 4. Request Clusters
        cluster1 = RequestCluster(
            title="Rural Road Connectivity & Asphalt Paving",
            category="Road Infrastructure", subcategory="Rural Road Connectivity",
            district="Pune", unique_request_count=837, total_request_count=2480,
            affected_villages_count=12, estimated_population=35000,
            priority_score=78.5, digital_access_correction=0.0, is_under_reported_flag=False, status="Active"
        )
        cluster2 = RequestCluster(
            title="Bhamragad Drinking Water Network & Filtration",
            category="Water", subcategory="Drinking Water Supply",
            district="Gadchiroli", unique_request_count=1204, total_request_count=4821,
            affected_villages_count=14, estimated_population=42800,
            priority_score=91.3, digital_access_correction=6.0, is_under_reported_flag=True, status="Active"
        )
        db.add_all([cluster1, cluster2])
        db.flush()

        # 5. Citizen Requests (Multilingual + Duplicate Slice)
        req1 = CitizenRequest(
            reference_code="#REQ-48213", channel="text", language="en",
            raw_text="Our village road is broken and ambulances cannot reach in emergencies.",
            translated_text="Unusable village road blocking medical access",
            category="Road Infrastructure", subcategory="Rural Road Connectivity",
            severity="high", urgency="critical", location_id=loc1.id,
            status="Under Review", cluster_id=cluster1.id, duplicate_count=4
        )
        req2 = CitizenRequest(
            reference_code="#REQ-48214", channel="voice", language="hi",
            raw_text="हमारे गांव में पिछले तीन साल से पीने का पानी नहीं आ रहा है। बच्चे और बुजुर्ग बीमार हैं।",
            transcribed_text="हमारे गांव में पिछले तीन साल से पीने का पानी नहीं आ रहा है।",
            translated_text="No drinking water supply for three years affecting elderly and children",
            category="Water", subcategory="Drinking Water Supply",
            severity="critical", urgency="critical", location_id=loc2.id,
            status="Under Review", cluster_id=cluster2.id, duplicate_count=12
        )
        req3 = CitizenRequest(
            reference_code="#REQ-48215", channel="whatsapp", language="mr",
            raw_text="आमच्या गावातील पिण्याच्या पाण्याची समस्या अत्यंत गंभीर आहे.",
            translated_text="Severe drinking water scarcity in village locality",
            category="Water", subcategory="Drinking Water Supply",
            severity="high", urgency="high", location_id=loc2.id,
            status="Merged into Cluster", cluster_id=cluster2.id, duplicate_count=0
        )
        req4 = CitizenRequest(
            reference_code="#REQ-48216", channel="whatsapp", language="pt",
            raw_text="Nossa vila não tem água potável há três anos. As crianças estão sofrendo.",
            translated_text="BRICS Language Demo: Portuguese water access report",
            category="Water", subcategory="Drinking Water Supply",
            severity="high", urgency="high", location_id=loc2.id,
            status="Merged into Cluster", cluster_id=cluster2.id, duplicate_count=0
        )
        db.add_all([req1, req2, req3, req4])
        db.flush()

        # 6. Investment Project & Retrospective Impact (Section 31)
        proj1 = InvestmentProject(
            title="Shirur Drinking Water Pipeline & Storage Tank",
            sector="Water", budget_crores=18.5, location_id=loc1.id,
            status="Completed", start_date=datetime.datetime(2025, 1, 15),
            completion_date=datetime.datetime(2025, 11, 20), existing_coverage_pct=71.0
        )
        db.add(proj1)
        db.flush()

        impact1 = InvestmentImpactHistory(
            project_id=proj1.id, measured_at=datetime.datetime.utcnow(),
            infra_index_before=41.0, infra_index_after=68.0,
            complaint_volume_before=1420, complaint_volume_after=596,
            complaint_reduction_pct=58.0, coverage_before_pct=32.0, coverage_after_pct=71.0
        )
        db.add(impact1)
        db.flush()

        # 7. Recommendations & Decisions (Section 28 & 29)
        rec1 = Recommendation(
            cluster_id=cluster2.id,
            proposed_intervention="Upgrade Rural Drinking Water Network & Install Solar Filtration Units in 14 Villages",
            priority_score=91.3,
            digital_access_correction=6.0,
            evidence_json={
                "total_requests": 4821,
                "unique_requests": 1204,
                "villages": 14,
                "population_impacted": 42800,
                "infrastructure_score": 32.0,
                "investment_coverage": 18.0,
                "digital_access_index": 38.0,
                "correction_applied": "+6.0 (Region flagged for under-reporting)"
            },
            status="Approved"
        )
        db.add(rec1)
        db.flush()

        dec1 = RecommendationDecision(
            recommendation_id=rec1.id,
            decision="Approved",
            decision_reason="Approved ₹18.5 Cr budget allocation under PM-Jal Jeevan Mission for Bhamragad block due to severe 3-year gap.",
            reviewer="District Magistrate, Gadchiroli"
        )
        db.add(dec1)
        db.commit()
        print("[SUCCESS] Demo Data Successfully Seeded!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
