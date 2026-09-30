import os
import sys
import datetime

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine, Base
from app.models.domain import (
    Location, Demographic, Infrastructure, CitizenRequest,
    RequestCluster, InvestmentProject, InvestmentImpactHistory,
    Recommendation, RecommendationDecision, AbuseFlag
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

        # 1. Locations across Maharashtra
        loc1 = Location(
            country="India", state="Maharashtra", district="Pune",
            locality="Shirur Taluka", latitude=18.8260, longitude=74.3790
        )
        loc2 = Location(
            country="India", state="Maharashtra", district="Gadchiroli",
            locality="Bhamragad Block", latitude=19.8762, longitude=80.2000
        )
        loc3 = Location(
            country="India", state="Maharashtra", district="Dharashiv",
            locality="Kalamb Block", latitude=18.2500, longitude=76.0500
        )
        loc4 = Location(
            country="India", state="Maharashtra", district="Nashik",
            locality="Dindori Taluka", latitude=20.2000, longitude=73.8300
        )
        db.add_all([loc1, loc2, loc3, loc4])
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
        demo3 = Demographic(
            location_id=loc3.id, population=78000, density=220.0,
            vulnerability_index=68.0, literacy_rate=68.5, mobile_penetration_rate=51.0, internet_penetration_rate=34.0
        )
        demo4 = Demographic(
            location_id=loc4.id, population=95000, density=280.0,
            vulnerability_index=52.0, literacy_rate=76.0, mobile_penetration_rate=68.0, internet_penetration_rate=52.0
        )
        db.add_all([demo1, demo2, demo3, demo4])
        db.flush()

        # 3. Infrastructure
        infra1 = Infrastructure(
            location_id=loc1.id, overall_index=65.0, road_coverage_pct=70.0, water_coverage_pct=60.0, health_facility_density=68.0
        )
        infra2 = Infrastructure(
            location_id=loc2.id, overall_index=32.0, road_coverage_pct=25.0, water_coverage_pct=18.0, health_facility_density=28.0
        )
        infra3 = Infrastructure(
            location_id=loc3.id, overall_index=44.5, road_coverage_pct=45.0, water_coverage_pct=31.0, health_facility_density=44.0
        )
        infra4 = Infrastructure(
            location_id=loc4.id, overall_index=55.0, road_coverage_pct=58.0, water_coverage_pct=52.0, health_facility_density=56.0
        )
        db.add_all([infra1, infra2, infra3, infra4])
        db.flush()

        # 4 & 5. Generate high volume of requests for 4 distinct DBSCAN clusters
        np.random.seed(42)
        base_embs = []
        for _ in range(4):
            v = np.random.normal(0, 1, 768)
            for prev in base_embs:
                v -= np.dot(v, prev) * prev
            v = v / np.linalg.norm(v)
            base_embs.append(v)

        requests = []
        # Cluster A: Gadchiroli - Water (1200 requests)
        for i in range(1200):
            noise = np.random.normal(0, 0.003, 768)
            v = (base_embs[0] + noise)
            v = (v / np.linalg.norm(v)).tolist()
            req = CitizenRequest(
                reference_code=f"#REQ-GAD-{i}", channel=random.choice(["text", "voice", "whatsapp"]), language="hi",
                raw_text=f"Water supply broken at house {i}",
                translated_text="No drinking water supply for three years affecting elderly and children",
                category="Water", subcategory="Drinking Water Supply",
                severity=random.choice(["high", "medium", "critical"]), urgency="high", location_id=loc2.id,
                status="Pending Cluster", duplicate_count=random.randint(0, 3),
                embedding_json=v
            )
            requests.append(req)

        # Cluster B: Dharashiv - Health (850 requests)
        for i in range(850):
            noise = np.random.normal(0, 0.003, 768)
            v = (base_embs[1] + noise)
            v = (v / np.linalg.norm(v)).tolist()
            req = CitizenRequest(
                reference_code=f"#REQ-DHA-{i}", channel=random.choice(["text", "voice", "whatsapp"]), language="mr",
                raw_text=f"Primary health center ambulance and medicine shortage {i}",
                translated_text="Rural health center lacks maternal emergency equipment and solar backup",
                category="Health", subcategory="Rural Health Center & Maternity Facility",
                severity=random.choice(["high", "medium", "critical"]), urgency="high", location_id=loc3.id,
                status="Pending Cluster", duplicate_count=random.randint(0, 2),
                embedding_json=v
            )
            requests.append(req)

        # Cluster C: Pune - Road Infrastructure (1100 requests)
        for i in range(1100):
            noise = np.random.normal(0, 0.003, 768)
            v = (base_embs[2] + noise)
            v = (v / np.linalg.norm(v)).tolist()
            req = CitizenRequest(
                reference_code=f"#REQ-PUNE-{i}", channel=random.choice(["text", "voice", "whatsapp"]), language="en",
                raw_text=f"Road repair needed at location {i}",
                translated_text="Unusable village road blocking medical access and bus transport",
                category="Road Infrastructure", subcategory="Rural Road Connectivity",
                severity=random.choice(["high", "medium", "critical"]), urgency="high", location_id=loc1.id,
                status="Pending Cluster", duplicate_count=random.randint(0, 5),
                embedding_json=v
            )
            requests.append(req)

        # Cluster D: Nashik - Electricity (950 requests)
        for i in range(950):
            noise = np.random.normal(0, 0.003, 768)
            v = (base_embs[3] + noise)
            v = (v / np.linalg.norm(v)).tolist()
            req = CitizenRequest(
                reference_code=f"#REQ-NSK-{i}", channel=random.choice(["text", "voice", "whatsapp"]), language="mr",
                raw_text=f"Severe power grid transformer failure at farm sector {i}",
                translated_text="Agricultural feeder tripping consistently causing irrigation pump failure",
                category="Electricity", subcategory="Agricultural Feeder & Grid Reliability",
                severity=random.choice(["high", "medium", "critical"]), urgency="medium", location_id=loc4.id,
                status="Pending Cluster", duplicate_count=random.randint(0, 3),
                embedding_json=v
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
            cluster_water = RequestCluster(
                title="Water - Gadchiroli Cluster",
                category="Water",
                subcategory="Drinking Water Supply",
                district="Gadchiroli",
                unique_request_count=1200,
                total_request_count=1200,
                affected_villages_count=14,
                estimated_population=42800,
                priority_score=91.3,
                digital_access_correction=11.6,
                is_under_reported_flag=True,
                status="Active"
            )
            db.add(cluster_water)
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
            project_id=proj1.id, measured_at=datetime.datetime.now(datetime.timezone.utc),
            infra_index_before=41.0, infra_index_after=68.0,
            complaint_volume_before=1420, complaint_volume_after=596,
            complaint_reduction_pct=58.0, coverage_before_pct=32.0, coverage_after_pct=71.0
        )
        db.add(impact1)
        db.flush()

        # 7. Recommendations & Human-in-the-Loop Decisions (Section 28 & 29)
        clusters = db.query(RequestCluster).all()
        for idx, c in enumerate(clusters):
            existing_rec = db.query(Recommendation).filter(Recommendation.cluster_id == c.id).first()
            if not existing_rec:
                status = "Approved" if c.district in ["Gadchiroli", "Pune"] else "Needs Analysis"
                reason = (
                    "Approved ₹18.5 Cr budget allocation under PM-Jal Jeevan Mission for Bhamragad block due to severe 3-year gap."
                    if c.district == "Gadchiroli"
                    else (
                        "Sanctioned ₹12.4 Cr under PMGSY Stage-II for rural road connectivity connecting 12 settlements."
                        if c.district == "Pune"
                        else "Dispatched for field inspection by District Health Officer regarding solar cold-chain backup."
                    )
                )
                rec = Recommendation(
                    cluster_id=c.id,
                    proposed_intervention=f"Comprehensive Infrastructure Upgrade for {c.title} ({c.district} District)",
                    priority_score=float(c.priority_score or 50.0),
                    digital_access_correction=float(c.digital_access_correction or 0.0),
                    evidence_json={
                        "total_requests": c.total_request_count,
                        "unique_requests": c.unique_request_count,
                        "villages": c.affected_villages_count,
                        "population_impacted": c.estimated_population,
                        "infrastructure_score": 65.0 if c.district == "Pune" else (32.0 if c.district == "Gadchiroli" else 44.5),
                        "investment_coverage": 50.0 if c.district == "Pune" else 18.0,
                        "digital_access_index": 72.0 if c.district == "Pune" else 38.0,
                        "correction_applied": f"+{c.digital_access_correction} Points" if c.is_under_reported_flag else "None"
                    },
                    status=status
                )
                db.add(rec)
                db.flush()

                dec = RecommendationDecision(
                    recommendation_id=rec.id,
                    decision=status,
                    decision_reason=reason,
                    reviewer=f"District Magistrate, {c.district}",
                    decided_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=8 * (idx + 1))
                )
                db.add(dec)

        # 8. Abuse Flags & Rate-Limit Anomaly Telemetry
        db.query(AbuseFlag).delete()
        ab1 = AbuseFlag(
            flag_reason="Rapid burst rate-limit: 12 requests in 30 seconds from single hashed device signature",
            anomaly_score=0.96,
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=45)
        )
        ab2 = AbuseFlag(
            flag_reason="Computer vision fraud mismatch: Uploaded photo verified as downloaded stock photo, not civic damage",
            anomaly_score=0.91,
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=2)
        )
        ab3 = AbuseFlag(
            flag_reason="High frequency cross-district coordinate spoofing detected from anonymous gateway",
            anomaly_score=0.88,
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=4)
        )
        ab4 = AbuseFlag(
            flag_reason="Repetitive verbatim template spam detected across multiple ward zones",
            anomaly_score=0.84,
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=6)
        )
        db.add_all([ab1, ab2, ab3, ab4])
        db.commit()
        print("[SUCCESS] Demo Data Successfully Seeded!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
