import unittest
import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.domain import CitizenRequest, RequestCluster, Location, Demographic
from app.ai.providers import ai_service
from app.ai.clustering import SemanticClusterEngine, cluster_engine

class TestSemanticClustering(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.cluster_engine = SemanticClusterEngine(eps=0.25, min_samples=2)

    def tearDown(self):
        self.db.close()

    def test_sparse_vs_dense_dbscan_equivalence(self):
        # Generate synthetic vectors
        np.random.seed(42)
        v1 = np.random.normal(1.0, 0.1, 768)
        v1 = v1 / np.linalg.norm(v1)
        v2 = np.random.normal(1.0, 0.1, 768)
        v2 = v2 / np.linalg.norm(v2)
        v3 = np.random.normal(-1.0, 0.1, 768)
        v3 = v3 / np.linalg.norm(v3)
        embeddings = [v1.tolist(), v2.tolist(), v3.tolist()]

        is_equiv = self.cluster_engine.validate_sparse_vs_dense(embeddings, eps=0.30, min_samples=2)
        self.assertTrue(is_equiv)

    def test_dbscan_grid_search_evaluation(self):
        np.random.seed(42)
        embeddings = [np.random.normal(0, 1, 768).tolist() for _ in range(10)]
        eval_res = self.cluster_engine.evaluate_grid(embeddings, eps_candidates=[0.20, 0.30], min_samples_candidates=[2, 3])
        self.assertIn("best_eps", eval_res)
        self.assertIn("grid_results", eval_res)

    def test_empty_dataset(self):
        res = self.cluster_engine.execute_batch_clustering(self.db)
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["processed_requests"], 0)

    def test_single_request(self):
        loc = Location(country="India", state="Maharashtra", district="Pune", locality="Shirur")
        self.db.add(loc)
        self.db.flush()

        emb = ai_service.embedding.generate_embedding("Road is damaged")
        req = CitizenRequest(
            reference_code="#REQ-S1", raw_text="Road is damaged",
            category="Road Infrastructure", location_id=loc.id, embedding_json=emb
        )
        self.db.add(req)
        self.db.commit()

        res = self.cluster_engine.execute_batch_clustering(self.db)
        self.assertEqual(res["status"], "SUCCESS")
        # Single request with min_samples=2 becomes noise -> cluster_id = None
        self.db.refresh(req)
        self.assertIsNone(req.cluster_id)

    def test_explicit_a_same_district_different_topics(self):
        loc = Location(country="India", state="Maharashtra", district="Pune", locality="Shirur")
        self.db.add(loc)
        self.db.flush()

        # Two water issues vs two electricity issues in same district
        w1_emb = ai_service.embedding.generate_embedding("Water supply is completely broken")
        w2_emb = ai_service.embedding.generate_embedding("No drinking water in our tap")
        e1_emb = ai_service.embedding.generate_embedding("Power outage for three days")
        e2_emb = ai_service.embedding.generate_embedding("Electricity transformer burst")

        r_w1 = CitizenRequest(reference_code="#REQ-W1", raw_text="Water 1", category="Water", location_id=loc.id, embedding_json=w1_emb)
        r_w2 = CitizenRequest(reference_code="#REQ-W2", raw_text="Water 2", category="Water", location_id=loc.id, embedding_json=w2_emb)
        r_e1 = CitizenRequest(reference_code="#REQ-E1", raw_text="Elec 1", category="Electricity", location_id=loc.id, embedding_json=e1_emb)
        r_e2 = CitizenRequest(reference_code="#REQ-E2", raw_text="Elec 2", category="Electricity", location_id=loc.id, embedding_json=e2_emb)

        self.db.add_all([r_w1, r_w2, r_e1, r_e2])
        self.db.commit()

        res = self.cluster_engine.execute_batch_clustering(self.db)
        self.assertEqual(res["status"], "SUCCESS")
        self.db.refresh(r_w1)
        self.db.refresh(r_e1)
        # Water and Electricity must not be forced into the same cluster ID
        if r_w1.cluster_id and r_e1.cluster_id:
            self.assertNotEqual(r_w1.cluster_id, r_e1.cluster_id)

    def test_explicit_d_outlier_noise(self):
        loc = Location(country="India", state="Maharashtra", district="Pune", locality="Shirur")
        self.db.add(loc)
        self.db.flush()

        # 2 road reports + 1 completely random outlier
        emb1 = ai_service.embedding.generate_embedding("Road asphalt is broken")
        emb2 = ai_service.embedding.generate_embedding("Village road damaged")
        emb_outlier = [0.9] + [0.0] * 767

        r1 = CitizenRequest(reference_code="#REQ-R1", raw_text="Road 1", category="Road Infrastructure", location_id=loc.id, embedding_json=emb1)
        r2 = CitizenRequest(reference_code="#REQ-R2", raw_text="Road 2", category="Road Infrastructure", location_id=loc.id, embedding_json=emb2)
        r_out = CitizenRequest(reference_code="#REQ-OUT", raw_text="Outlier", category="Other", location_id=loc.id, embedding_json=emb_outlier)

        self.db.add_all([r1, r2, r_out])
        self.db.commit()

        res = self.cluster_engine.execute_batch_clustering(self.db)
        self.assertEqual(res["status"], "SUCCESS")

        self.db.refresh(r_out)
        # Outlier MUST have cluster_id = None (NEVER persisted as RequestCluster(id=-1))
        self.assertIsNone(r_out.cluster_id)

if __name__ == "__main__":
    unittest.main()
