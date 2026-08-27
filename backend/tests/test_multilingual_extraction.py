import unittest
from app.ai.providers import GeminiLLMProvider

class TestMultilingualExtraction(unittest.TestCase):
    def setUp(self):
        self.provider = GeminiLLMProvider(api_key="")

    def test_english_extraction(self):
        text = "Our village has no drinking water supply for three years."
        res = self.provider.extract_structured(text, language="en")
        self.assertEqual(res.category, "Water")
        self.assertEqual(res.subcategory, "Drinking Water Supply")
        self.assertEqual(res.language_detected, "en")
        self.assertIn(res.provider_status, ["REAL", "DEVELOPMENT FALLBACK"])

    def test_hindi_extraction(self):
        text = "हमारे गांव में पीने का पानी नहीं है।"
        res = self.provider.extract_structured(text, language="hi")
        self.assertEqual(res.category, "Water")
        self.assertEqual(res.subcategory, "Drinking Water Supply")
        self.assertEqual(res.language_detected, "hi")

    def test_marathi_extraction(self):
        text = "आमच्या गावात पिण्याचे पाणी नाही."
        res = self.provider.extract_structured(text, language="mr")
        self.assertEqual(res.category, "Water")
        self.assertEqual(res.subcategory, "Drinking Water Supply")
        self.assertEqual(res.language_detected, "mr")

    def test_cross_lingual_equivalence(self):
        # English, Hindi, Marathi equivalent reports must map to exact same category & subcategory
        en_res = self.provider.extract_structured("Our village needs drinking water pipeline", language="en")
        hi_res = self.provider.extract_structured("हमारे गांव को पीने के पानी की पाइपलाइन चाहिए", language="hi")
        mr_res = self.provider.extract_structured("आमच्या गावाला पिण्याच्या पाण्याची पाईपलाईन हवी आहे", language="mr")

        self.assertEqual(en_res.category, hi_res.category)
        self.assertEqual(hi_res.category, mr_res.category)
        self.assertEqual(en_res.subcategory, hi_res.subcategory)
        self.assertEqual(hi_res.subcategory, mr_res.subcategory)

if __name__ == "__main__":
    unittest.main()
