"""
CivicPulse AI — Reference Public Benchmark Service
Loads seeded demographic and infrastructure baseline data for districts.
Note: Seeded reference values for demo/evaluation; not a live government API sync.
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.domain import Location, Demographic, Infrastructure

NATIONAL_DATA_BENCHMARKS = [
    {
        "district": "Pune",
        "state": "Maharashtra",
        "locality": "Shirur Taluka",
        "latitude": 18.8260,
        "longitude": 74.3790,
        "population": 125000,
        "density": 360.0,
        "vulnerability_index": 42.0,
        "literacy_rate": 83.5,
        "mobile_penetration_rate": 78.5,
        "internet_penetration_rate": 66.0,
        "road_coverage_pct": 72.0,       # Seeded PMGSY Benchmark Model
        "water_coverage_pct": 64.0,      # Seeded Jal Jeevan Mission Model
        "health_facility_density": 69.0, # Seeded Health Infrastructure Model
        "electricity_reliability_pct": 82.0,
        "data_source": "Seeded Reference Baseline (Census/PMGSY Model)"
    },
    {
        "district": "Gadchiroli",
        "state": "Maharashtra",
        "locality": "Bhamragad Tribal Block",
        "latitude": 19.8762,
        "longitude": 75.3433,
        "population": 44500,
        "density": 105.0,
        "vulnerability_index": 84.0,
        "literacy_rate": 53.0,
        "mobile_penetration_rate": 36.5, # Low digital access triggers +N priority correction
        "internet_penetration_rate": 20.0,
        "road_coverage_pct": 28.0,
        "water_coverage_pct": 22.0,
        "health_facility_density": 25.0,
        "electricity_reliability_pct": 38.0,
        "data_source": "Seeded Reference Baseline (Tribal Area Model)"
    },
    {
        "district": "Dharashiv",
        "state": "Maharashtra",
        "locality": "Kalamb Block",
        "latitude": 18.2500,
        "longitude": 76.0500,
        "population": 78000,
        "density": 220.0,
        "vulnerability_index": 68.0,
        "literacy_rate": 68.5,
        "mobile_penetration_rate": 51.0,
        "internet_penetration_rate": 34.0,
        "road_coverage_pct": 45.0,
        "water_coverage_pct": 31.0,
        "health_facility_density": 44.0,
        "electricity_reliability_pct": 58.0,
        "data_source": "Seeded Reference Baseline (Drought-Prone Area Model)"
    }
]

def load_reference_benchmarks(db: Session) -> Dict[str, Any]:
    """
    Load Reference Benchmark Data (seeded, not a live government API sync).
    Seeds or resets local demographic and infrastructure records to benchmark values.
    """
    updated_count = 0
    created_count = 0

    for item in NATIONAL_DATA_BENCHMARKS:
        loc = db.query(Location).filter(
            Location.district == item["district"],
            Location.locality == item["locality"]
        ).first()

        if not loc:
            loc = Location(
                country="India",
                state=item["state"],
                district=item["district"],
                locality=item["locality"],
                latitude=item["latitude"],
                longitude=item["longitude"]
            )
            db.add(loc)
            db.flush()
            created_count += 1
        else:
            updated_count += 1

        # Seed Demographics
        demo = db.query(Demographic).filter(Demographic.location_id == loc.id).first()
        if not demo:
            demo = Demographic(location_id=loc.id)
            db.add(demo)
        demo.population = item["population"]
        demo.density = item["density"]
        demo.vulnerability_index = item["vulnerability_index"]
        demo.literacy_rate = item["literacy_rate"]
        demo.mobile_penetration_rate = item["mobile_penetration_rate"]
        demo.internet_penetration_rate = item["internet_penetration_rate"]

        # Seed Infrastructure Indices
        infra = db.query(Infrastructure).filter(Infrastructure.location_id == loc.id).first()
        if not infra:
            infra = Infrastructure(location_id=loc.id)
            db.add(infra)
        infra.road_coverage_pct = item["road_coverage_pct"]
        infra.water_coverage_pct = item["water_coverage_pct"]
        infra.health_facility_density = item["health_facility_density"]
        infra.electricity_reliability_pct = item["electricity_reliability_pct"]
        infra.overall_index = round(
            (item["road_coverage_pct"] + item["water_coverage_pct"] +
             item["health_facility_density"] + item["electricity_reliability_pct"]) / 4.0, 1
        )

    db.commit()

    return {
        "status": "success",
        "action": "load_reference_benchmarks",
        "is_live_sync": False,
        "synced_districts": len(NATIONAL_DATA_BENCHMARKS),
        "created_locations": created_count,
        "updated_locations": updated_count,
        "note": "Loaded seeded reference benchmark data (not a live government API sync)."
    }

# Backward compatibility alias
sync_national_datasets = load_reference_benchmarks

