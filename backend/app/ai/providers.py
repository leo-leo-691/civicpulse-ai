import os
import json
import numpy as np
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.requests import ExtractedCitizenRequest
from app.core.config import settings

# --- Provider Interfaces ---

class BaseLLMProvider(ABC):
    @abstractmethod
    def extract_structured(self, text: str, language: str) -> ExtractedCitizenRequest:
        pass

class BaseEmbeddingProvider(ABC):
    @abstractmethod
    def generate_embedding(self, text: str) -> List[float]:
        pass

class BaseSpeechProvider(ABC):
    @abstractmethod
    def transcribe(self, audio_data: str, language: Optional[str] = None) -> Dict[str, str]:
        pass

# --- Gemini Provider Implementation ---

# --- Provider Implementation ---

class GeminiLLMProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = None
        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self._client = genai.GenerativeModel("gemini-1.5-flash")
            except Exception:
                self._client = None

    def extract_structured(self, text: str, language: str = "en") -> ExtractedCitizenRequest:
        if self._client and text and text.strip():
            prompt = f"""
            You are a public infrastructure request extraction AI for BRICS governance.
            Extract structured data from the following citizen report (Language: {language}).
            Return ONLY valid JSON matching this exact structure:
            {{
                "category": "Road Infrastructure" | "Water" | "Health" | "Education" | "Electricity" | "Public Transport",
                "subcategory": "Rural Road Connectivity" | "Drinking Water" | "Primary Health Center" | "School Building" | "Power Grid",
                "severity": "low" | "medium" | "high" | "critical",
                "urgency": "low" | "medium" | "high" | "critical",
                "affected_groups": ["children", "elderly", "farmers"],
                "issue_summary": "Concise summary",
                "potential_impact": "Community impact summary",
                "location_mentions": ["Village name"]
            }}

            Citizen Input: "{text}"
            """
            try:
                response = self._client.generate_content(prompt)
                clean_json = response.text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_json)
                req = ExtractedCitizenRequest(**data)
                req.language_detected = language
                req.translated_text = req.issue_summary
                req.model_confidence = None  # Model confidence is unavailable unless explicitly scored
                req.provider_status = "REAL"
                return req
            except Exception:
                pass  # Graceful fallback to heuristic parser

        # Robust Heuristic Local Parser (DEVELOPMENT FALLBACK)
        lower = (text or "").lower()
        cat = "Road Infrastructure"
        subcat = "Rural Road Connectivity"
        if any(w in lower for w in ["water", "पानी", "प्राशन", "जल", "पाणी", "पाण्या", "पिण्या", "drinking", "well", "tap", "pipeline", "पाइप", "नळ"]):
            cat = "Water"
            subcat = "Drinking Water Supply"
        elif any(w in lower for w in ["hospital", "doctor", "health", "आरोग्य", "अस्पताल", "bimar", "medical", "clinic", "वैद्यकीय", "दवाखाना"]):
            cat = "Health"
            subcat = "Primary Health Center"
        elif any(w in lower for w in ["school", "teacher", "education", "शाळा", "स्कूल", "class", "student", "शिक्षक", "शिक्षण"]):
            cat = "Education"
            subcat = "School Infrastructure"
        elif any(w in lower for w in ["power", "electricity", "light", "वीज", "बिजली", "transformer", "outage", "विद्युत"]):
            cat = "Electricity"
            subcat = "Power Grid Reliability"

        severity = "high" if any(w in lower for w in ["broken", "urgent", "danger", "खराब", "आणीबाणी", "grave", "severe"]) else "medium"
        urgency = "high" if any(w in lower for w in ["three years", "urgent", "तुरंत", "तात्काळ", "immediately"]) else "medium"

        return ExtractedCitizenRequest(
            category=cat,
            subcategory=subcat,
            severity=severity,
            urgency=urgency,
            affected_groups=["children", "elderly", "residents"],
            issue_summary=text[:120] if text else "Public infrastructure request",
            potential_impact="Health, livelihood and public safety",
            location_mentions=[],
            language_detected=language or "en",
            translated_text=text or "",
            model_confidence=None,
            provider_status="DEVELOPMENT FALLBACK"
        )

class GeminiEmbeddingProvider(BaseEmbeddingProvider):
    def __init__(self, api_key: str, expected_dim: int = 768):
        self.api_key = api_key
        self.expected_dim = expected_dim
        self._genai = None
        self.last_provider_status = "DEVELOPMENT FALLBACK"
        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self._genai = genai
            except Exception:
                pass

    def validate_dimension(self, vector: List[float], expected_dim: Optional[int] = None) -> List[float]:
        target = expected_dim or self.expected_dim
        if len(vector) != target:
            raise ValueError(f"Embedding dimension mismatch: expected {target}, got {len(vector)}")
        return vector

    def generate_embedding(self, text: str) -> List[float]:
        text_content = text or ""
        if self._genai:
            try:
                res = self._genai.embed_content(
                    model="models/text-embedding-004",
                    content=text_content,
                    task_type="retrieval_document"
                )
                emb = res['embedding']
                self.last_provider_status = "REAL"
                self.expected_dim = len(emb)
                return self.validate_dimension(emb)
            except Exception:
                pass

        # Deterministic pseudo-embedding generator (DEVELOPMENT FALLBACK)
        self.last_provider_status = "DEVELOPMENT FALLBACK"
        np.random.seed(abs(hash(text_content)) % (2**32))
        raw_vec = np.random.normal(0, 1, self.expected_dim)
        norm = np.linalg.norm(raw_vec)
        if norm > 0:
            raw_vec = raw_vec / norm
        return raw_vec.tolist()

class GoogleSpeechProvider(BaseSpeechProvider):
    def __init__(self, credentials_path: Optional[str] = None):
        self.credentials_path = credentials_path or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        self.provider_status = "REAL" if self.credentials_path else "DEVELOPMENT FALLBACK"

    def transcribe(self, audio_data: str, language: Optional[str] = None) -> Dict[str, str]:
        if self.credentials_path:
            try:
                from google.cloud import speech
                client = speech.SpeechClient()
                # Real speech recognition attempt
                audio = speech.RecognitionAudio(content=audio_data.encode('utf-8') if isinstance(audio_data, str) else audio_data)
                config = speech.RecognitionConfig(
                    encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                    sample_rate_hertz=16000,
                    language_code=language or "hi-IN"
                )
                response = client.recognize(config=config, audio=audio)
                if response.results:
                    transcript = response.results[0].alternatives[0].transcript
                    return {
                        "language": language or "hi",
                        "transcribed_text": transcript,
                        "provider_status": "REAL"
                    }
            except Exception:
                pass

        # DEVELOPMENT FALLBACK Speech Provider
        lang = language or "hi"
        if lang == "hi":
            text = "हमारे गांव की सड़क पूरी तरह से खराब हो चुकी है, एम्बुलेंस भी नहीं आ सकती।"
        elif lang == "mr":
            text = "आमच्या गावातील पिण्याच्या पाण्याची समस्या गंभीर आहे, तीन वर्षांपासून पाणी नाही."
        elif lang == "pt":
            text = "Nossa vila não tem água potável há três anos. As crianças estão sofrendo."
        else:
            text = "Our village road is completely damaged and unusable for ambulances."
        
        return {
            "language": lang,
            "transcribed_text": text,
            "provider_status": "DEVELOPMENT FALLBACK"
        }

class MockGoogleSpeechProvider(GoogleSpeechProvider):
    pass

# --- Service Container ---

class AIServiceContainer:
    def __init__(self):
        key = settings.GEMINI_API_KEY
        self.llm = GeminiLLMProvider(key)
        self.embedding = GeminiEmbeddingProvider(key)
        self.speech = GoogleSpeechProvider()

ai_service = AIServiceContainer()

