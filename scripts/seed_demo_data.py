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
from app.ai.clustering import SemanticClusterEngine
import numpy as np
import random

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

        # 4 & 5. Generate high volume of requests for Clustering
        requests = []
        # Pune Road Requests
        base_emb_road = np.random.normal(0, 1, 768)
        base_emb_road = base_emb_road / np.linalg.norm(base_emb_road)
        for i in range(1500):
            req = CitizenRequest(
                reference_code=f"#REQ-PUNE-{i}", channel=random.choice(["text", "voice", "whatsapp"]), language="en",
                raw_text=f"Road repair needed at location {i}",
                translated_text="Unusable village road blocking medical access",
                category="Road Infrastructure", subcategory="Rural Road Connectivity",
                severity=random.choice(["high", "medium", "critical"]), urgency="high", location_id=loc1.id,
                status="Pending Cluster", duplicate_count=random.randint(0, 5),
                embedding_json=base_emb_road.tolist()
            )
            requests.append(req)

        # Gadchiroli Water Requests
        base_emb_water = np.random.normal(0, 1, 768)
        base_emb_water = base_emb_water / np.linalg.norm(base_emb_water)
        for i in range(2500):
            req = CitizenRequest(
                reference_code=f"#REQ-GAD-{i}", channel=random.choice(["text", "voice", "whatsapp"]), language="hi",
                raw_text=f"Water supply broken at house {i}",
                translated_text="No drinking water supply for three years affecting elderly and children",
                category="Water", subcategory="Drinking Water Supply",
                severity=random.choice(["high", "medium", "critical"]), urgency="high", location_id=loc2.id,
                status="Pending Cluster", duplicate_count=random.randint(0, 3),
                embedding_json=base_emb_water.tolist()
            )
            requests.append(req)

        db.add_all(requests)
        db.flush()

        # Run DBSCAN Clustering to automatically create RequestCluster records
        cluster_engine = SemanticClusterEngine()
        cluster_engine.execute_batch_clustering(db)
        db.commit()

        # Fetch the newly created clusters to link recommendations
        cluster_water = db.query(RequestCluster).filter(RequestCluster.district == "Gadchiroli").first()
        if not cluster_water:
            # Fallback if clustering failed for some reason
            cluster_water = RequestCluster(id=2)

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
            cluster_id=cluster_water.id,
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
