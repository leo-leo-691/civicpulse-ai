import unittest
from app.schemas.requests import GroundedRecommendation
from app.services.ai_recommendations import generate_grounded_recommendation, validate_recommendation_evidence

class TestRecommendationsGrounding(unittest.TestCase):
    def test_valid_grounded_recommendation(self):
        evidence = {
            "category": "Water",
            "district": "Gadchiroli",
            "affected_villages": 14,
            "population_of_affected_locations": 42800,
            "priority_score": 91.3,
            "digital_access_correction": 6.0
        }

        rec = generate_grounded_recommendation(cluster_id=1, evidence_json=evidence)
        self.assertEqual(rec.cluster_id, 1)
        self.assertEqual(rec.validation_status, "VALIDATED")
        self.assertIn("Gadchiroli", rec.proposed_intervention)

    def test_rejection_of_unsupported_claims(self):
        evidence = {
            "category": "Water",
            "district": "Gadchiroli",
            "affected_villages": 14,
            "population_of_affected_locations": 42800,
            "priority_score": 91.3
        }

        # Create a recommendation claiming 999,999 population (hallucinated!)
        hallucinated_rec = GroundedRecommendation(
            cluster_id=1,
            proposed_intervention="Upgrade water system for 999999 citizens in 99 villages",
            priority_score=91.3,
            referenced_population=999999,
            referenced_villages=99
        )

        is_valid, errors = validate_recommendation_evidence(hallucinated_rec, evidence)
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)

if __name__ == "__main__":
    unittest.main()
