import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.domain import CitizenRequest, Location
from app.schemas.requests import RequestCreate
from app.ai.pipeline import process_incoming_request, compute_text_hash, normalize_text_for_hash

class TestDuplicateDetection(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()

    def test_text_normalization_and_hash(self):
        text1 = "  Our Village   Road is BROKEN.  "
        text2 = "our village road is broken."
        text_hi1 = "  हमारे  गांव की सड़क   खराब है। "
        text_hi2 = "हमारे गांव की सड़क खराब है।"

        self.assertEqual(compute_text_hash(text1), compute_text_hash(text2))
        self.assertEqual(compute_text_hash(text_hi1), compute_text_hash(text_hi2))

    def test_exact_and_semantic_duplicate_flow(self):
        # 1. First submission (Primary)
        payload1 = RequestCreate(
            raw_text="Our village road is completely damaged and ambulances cannot pass.",
            district="Pune", locality="Shirur"
        )
        req1, is_dup1, orig1 = process_incoming_request(self.db, payload1)
        self.assertFalse(is_dup1)
        self.assertIsNone(orig1)
        self.assertIsNotNone(req1.id)
        self.assertIsNone(req1.duplicate_of_id)

        # 2. Exact duplicate submission (Normalized hash match)
        payload2 = RequestCreate(
            raw_text="our village road is completely damaged and ambulances cannot pass.",
            district="Pune", locality="Shirur"
        )
        req2, is_dup2, orig2 = process_incoming_request(self.db, payload2)
        self.assertTrue(is_dup2)
        self.assertIsNotNone(orig2)
        self.assertEqual(orig2.id, req1.id)
        self.assertEqual(req2.duplicate_of_id, req1.id)

        # Original submission MUST still exist in database
        all_reqs = self.db.query(CitizenRequest).all()
        self.assertEqual(len(all_reqs), 2)
        self.assertEqual(all_reqs[0].id, req1.id)

if __name__ == "__main__":
    unittest.main()
