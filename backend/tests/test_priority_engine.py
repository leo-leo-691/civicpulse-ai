import unittest
from app.services.priority import calculate_priority_score

class TestPriorityEngine(unittest.TestCase):
    def test_priority_score_calculation(self):
        # Normal region with high mobile penetration
        score_normal = calculate_priority_score(
            unique_request_count=50,
            total_request_count=100,
            infra_coverage_pct=40.0,
            affected_population=25000,
            vulnerability_index=60.0,
            existing_investment_pct=30.0,
            urgency_score=80.0,
            mobile_penetration_pct=80.0
        )
        self.assertGreater(score_normal.overall_score, 0)
        self.assertEqual(score_normal.digital_access_correction, 0.0)
        self.assertFalse(score_normal.under_reported_flag)

    def test_digital_divide_correction(self):
        # Low mobile penetration (38%) + high infrastructure gap (coverage 18% -> gap 82%)
        score_under_reported = calculate_priority_score(
            unique_request_count=20, # Low reported demand due to poor access!
            total_request_count=25,
            infra_coverage_pct=18.0,
            affected_population=42800,
            vulnerability_index=82.0,
            existing_investment_pct=18.0,
            urgency_score=90.0,
            mobile_penetration_pct=38.0
        )
        
        # Assert positive correction applied!
        self.assertGreater(score_under_reported.digital_access_correction, 0.0)
        self.assertTrue(score_under_reported.under_reported_flag)
        self.assertIn("Digital-Access Index", score_under_reported.evidence_bullet_points[-1])

if __name__ == "__main__":
    unittest.main()
