import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("project", res.json())
        self.assertEqual(res.json()["project"], "CivicPulse AI")

    def test_analytics_overview(self):
        res = self.client.get("/api/v1/analytics/overview")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_requests", data)
        self.assertIn("unique_requests", data)

    def test_hotspots_endpoint(self):
        res = self.client.get("/api/v1/hotspots")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    def test_open_data_export(self):
        res = self.client.get("/api/v1/open-data/export")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    def test_invalid_decision_rejected(self):
        # Requires id=1 to exist, but if validation happens first, we should get 422 Unprocessable Entity
        res = self.client.post("/api/v1/recommendations/1/decision", json={
            "decision": "Not A Valid Decision",
            "decision_reason": "Testing invalid enum",
            "reviewer": "Test Bot"
        })
        self.assertEqual(res.status_code, 422)

if __name__ == "__main__":
    unittest.main()
