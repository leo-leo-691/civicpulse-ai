import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.domain import CitizenRequest
from app.schemas.requests import RequestCreate
from app.ai.providers import GeminiEmbeddingProvider, GoogleSpeechProvider, GeminiLLMProvider
from app.ai.pipeline import process_incoming_request

class TestPipelineFailures(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()

    def test_empty_text_payload_recovery(self):
        payload = RequestCreate(raw_text="", district="Pune", locality="Shirur")
        req, is_dup, orig = process_incoming_request(self.db, payload)
        self.assertIsNotNone(req.id)
        self.assertGreater(len(req.raw_text), 0)

    def test_dimension_validation_mismatch_raises_error(self):
        provider = GeminiEmbeddingProvider(api_key="", expected_dim=768)
        with self.assertRaises(ValueError):
            provider.validate_dimension([0.1, 0.2], expected_dim=768)

    def test_speech_provider_fallback_handling(self):
        provider = GoogleSpeechProvider(credentials_path=None)
        res = provider.transcribe("invalid_audio_base64_data", language="hi")
        self.assertEqual(res["provider_status"], "DEVELOPMENT FALLBACK")
        self.assertIn("transcribed_text", res)

    def test_llm_provider_fallback_status(self):
        provider = GeminiLLMProvider(api_key="")
        res = provider.extract_structured("School building needs roof repair", language="en")
        self.assertEqual(res.provider_status, "DEVELOPMENT FALLBACK")
        self.assertIsNone(res.model_confidence)

if __name__ == "__main__":
    unittest.main()
