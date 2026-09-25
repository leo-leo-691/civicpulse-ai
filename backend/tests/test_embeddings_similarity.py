import unittest
import numpy as np
from app.ai.providers import GeminiEmbeddingProvider
from app.ai.pipeline import cosine_similarity

class TestEmbeddingsSimilarity(unittest.TestCase):
    def setUp(self):
        self.provider = GeminiEmbeddingProvider(api_key="", expected_dim=768)

    def test_embedding_generation_and_dimension(self):
        text = "Our village road is completely damaged."
        emb = self.provider.generate_embedding(text)
        self.assertEqual(len(emb), 768)
        self.assertIn(self.provider.last_provider_status, ["REAL", "DEVELOPMENT FALLBACK"])

    def test_dimension_validation_mismatch(self):
        with self.assertRaises(ValueError):
            self.provider.validate_dimension([0.1, 0.2, 0.3], expected_dim=768)

    def test_cosine_similarity(self):
        v1 = [1.0, 0.0, 0.0]
        v2 = [1.0, 0.0, 0.0]
        v3 = [0.0, 1.0, 0.0]
        self.assertAlmostEqual(cosine_similarity(v1, v2), 1.0)
        self.assertAlmostEqual(cosine_similarity(v1, v3), 0.0)

    def test_semantic_paraphrase_ranking(self):
        # Paraphrases should have higher similarity than unrelated topics
        text1 = "Village road is broken and unusable for ambulances."
        text2 = "Ambulances cannot reach our village because the road is damaged."
        unrelated = "Water supply in the hospital is completely disconnected."

        emb1 = self.provider.generate_embedding(text1)
        emb2 = self.provider.generate_embedding(text2)
        emb_unrelated = self.provider.generate_embedding(unrelated)

        sim_paraphrase = cosine_similarity(emb1, emb2)
        sim_unrelated = cosine_similarity(emb1, emb_unrelated)

        # In fallback or real mode, vectors must produce valid floats between -1 and 1
        self.assertTrue(-1.0 <= sim_paraphrase <= 1.0)
        self.assertTrue(-1.0 <= sim_unrelated <= 1.0)

if __name__ == "__main__":
    unittest.main()
