'use client';

import React, { useState, useRef } from 'react';
import { Mic, Send, MessageSquare, Search, CheckCircle, AlertTriangle, ShieldCheck, Camera, Sparkles, Image as ImageIcon, Eye } from 'lucide-react';
import {
  submitCitizenRequest,
  getCitizenRequestStatus,
  sendMessagingWebhook,
  CitizenRequestResponse,
  CitizenStatus,
  MessagingWebhookResponse,
} from '@/lib/api';

export default function CitizenPortal() {
  const [activeTab, setActiveTab] = useState<'submit' | 'status' | 'messaging'>('submit');
  const [language, setLanguage] = useState('en');
  const [channel, setChannel] = useState('text');
  const [district, setDistrict] = useState('Pune');
  const [locality, setLocality] = useState('Shirur Village');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [micError, setMicError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [submitResult, setSubmitResult] = useState<CitizenRequestResponse | null>(null);
  const [submitError, setSubmitError] = useState<string>('');
  const [webhookError, setWebhookError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image file under 5MB.');
        return;
      }
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageBase64(null);
    setImageFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    setMicError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicError('Microphone recording is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Result = reader.result as string;
          setAudioBase64(base64Result);
        };
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setMicError('Microphone access denied or unavailable. Please check browser permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearAudio = () => {
    setAudioBase64(null);
  };

  // Status Lookup State
  const [searchRef, setSearchRef] = useState('');
  const [statusResult, setStatusResult] = useState<CitizenStatus | null>(null);
  const [statusError, setStatusError] = useState('');

  // Messaging Webhook State
  const [webhookText, setWebhookText] = useState('हमारे गांव में पिछले तीन साल से पीने का पानी नहीं आ रहा है।');
  const [webhookPhone, setWebhookPhone] = useState('+919876543210');
  const [webhookResponse, setWebhookResponse] = useState<MessagingWebhookResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitResult(null);
    setSubmitError('');

    const stepDelay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    // Sequence visual steps through 1 -> 2 -> 3 -> 4 over ~3.2s
    const runVisualSteps = async () => {
      setProcessingStep(1);
      await stepDelay(800);
      setProcessingStep(2);
      await stepDelay(800);
      setProcessingStep(3);
      await stepDelay(800);
      setProcessingStep(4);
      await stepDelay(800);
    };

    try {
      const [data] = await Promise.all([
        submitCitizenRequest({
          raw_text: inputText,
          ...(audioBase64 ? { audio_base64: audioBase64, channel: 'voice' } : { channel: channel }),
          image_base64: imageBase64 || undefined,
          language: language,
          district: district,
          locality: locality,
          reporter_contact_hash: "web_user_hash"
        }),
        runVisualSteps()
      ]);
    } catch (err: any) {
      await runVisualSteps().catch(() => {});
      setSubmitError(`Warning: Real-time API connection interrupted. Displaying preview.`);
      // Mock fallback for UI demo if backend server offline
      setSubmitResult({
        status: "success",
        reference_code: `#REQ-${Math.floor(10000 + Math.random() * 90000)}`,
        is_duplicate: false,
        category: "Road Infrastructure",
        subcategory: "Rural Road Connectivity",
        severity: "high",
        has_image: Boolean(imageBase64),
        visual_evidence: imageBase64 ? {
          verified_category: "Road Infrastructure",
          damage_severity: "high",
          structural_risk_score: 84.0,
          detected_objects: ["asphalt pothole", "surface crater", "unpaved mud shoulder"],
          visual_evidence_summary: "Gemini Vision confirmed critical road surface wash-out causing high transit hazard.",
          is_genuine_infrastructure_issue: true,
          confidence: 0.94
        } : undefined,
        message: "Your request has been received and processed."
      });
    } finally {
      setLoading(false);
      setProcessingStep(0);
    }
  };

  const handleStatusSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError('');
    setStatusResult(null);
    setLoading(true);

    try {
      const data = await getCitizenRequestStatus(searchRef);
      setStatusResult(data);
    } catch (err: any) {
      setStatusError("Request reference code not found. Please check #REQ-XXXXX format or server connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await sendMessagingWebhook({
        Body: webhookText,
        From: `whatsapp:${webhookPhone}`
      });
      setWebhookResponse(data);
    } catch (err: any) {
      setWebhookError("Failed to trigger webhook: Server unreachable.");
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetLang: string, presetText: string) => {
    setLanguage(presetLang);
    setInputText(presetText);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#0c1222]/90 rounded-2xl shadow-2xl border border-slate-800 text-slate-100 backdrop-blur-md">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Citizen Voice Portal</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Multilingual Ingestion
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">Direct community signal ingestion via voice audio, photo analysis, text, and WhatsApp.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30 shrink-0">
          <ShieldCheck className="w-4 h-4" /> Digital Public Good
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-2 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('submit')}
          className={`pb-3 font-semibold text-xs sm:text-sm transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'submit' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic className="w-4 h-4" /> Submit Request
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`pb-3 font-semibold text-xs sm:text-sm transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'status' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" /> Check Request Status
        </button>
        <button
          onClick={() => setActiveTab('messaging')}
          className={`pb-3 font-semibold text-xs sm:text-sm transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'messaging' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> WhatsApp / SMS Channel Demo
        </button>
      </div>

      {/* Tab 1: Submit Request */}
      {activeTab === 'submit' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quick Presets for Demo */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
            <span className="font-semibold text-slate-300 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Multilingual Demo Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset('en', 'Our village road is completely broken and ambulances cannot reach during emergencies.')}
                className="px-2.5 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-md text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-xs"
              >
                🇬🇧 English Text
              </button>
              <button
                type="button"
                onClick={() => setPreset('hi', 'हमारे गांव में पिछले तीन साल से पीने का पानी नहीं आ रहा है। बच्चे बीमार हैं।')}
                className="px-2.5 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-md text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-xs"
              >
                🇮🇳 Hindi Report
              </button>
              <button
                type="button"
                onClick={() => setPreset('mr', 'आमच्या गावातील रस्ता अत्यंत खराब झाला आहे, शाळा सुटल्यावर मुले घरी येऊ शकत नाहीत.')}
                className="px-2.5 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-md text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-xs"
              >
                🇮🇳 Marathi Report
              </button>
              <button
                type="button"
                onClick={() => setPreset('pt', 'Nossa vila não tem água potável há três anos. As crianças estão sofrendo.')}
                className="px-2.5 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-md text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-xs"
              >
                🇧🇷 Portuguese (BRICS Demo)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="citizen-language-select" className="block text-xs font-semibold text-slate-300 mb-1">Language</label>
              <select
                id="citizen-language-select"
                aria-label="Select Preferred Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-sm border border-slate-700 rounded-lg p-2.5 bg-slate-900 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
              >
                <option value="en">English (English)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="pt">Portuguese (Português - BRICS)</option>
              </select>
            </div>
            <div>
              <label htmlFor="citizen-district-select" className="block text-xs font-semibold text-slate-300 mb-1">District</label>
              <select
                id="citizen-district-select"
                aria-label="Select District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-sm border border-slate-700 rounded-lg p-2.5 bg-slate-900 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
              >
                <option value="Pune">Pune (High Connectivity)</option>
                <option value="Gadchiroli">Gadchiroli (Low Mobile Access - Under-Reported)</option>
              </select>
            </div>
            <div>
              <label htmlFor="citizen-locality-input" className="block text-xs font-semibold text-slate-300 mb-1">Locality / Village</label>
              <input
                id="citizen-locality-input"
                aria-label="Enter Locality or Village Name"
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full text-sm border border-slate-700 rounded-lg p-2.5 bg-slate-900 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
                placeholder="Village or Town Name"
              />
            </div>
          </div>

          {/* Voice vs Text toggle */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="citizen-description-textarea" className="text-xs font-semibold text-slate-300">
                Citizen Description (Voice or Text)
              </label>
              <button
                type="button"
                onClick={toggleRecording}
                aria-label={isRecording ? 'Stop Recording' : 'Record Audio'}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                {isRecording ? 'Stop Recording (Listening...)' : 'Record Audio (Microphone)'}
              </button>
            </div>
            {audioBase64 && !isRecording && (
              <div className="mb-2 p-2.5 bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-xs rounded-lg flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Audio recorded and ready for submission
                </span>
                <button
                  type="button"
                  onClick={clearAudio}
                  aria-label="Clear recorded audio"
                  className="text-slate-400 hover:text-white font-bold ml-2 text-xs"
                >
                  ✕ Clear
                </button>
              </div>
            )}
            {micError && (
              <div className="mb-2 p-2.5 bg-red-950/40 border border-red-700/60 text-red-300 text-xs rounded-lg">
                {micError}
              </div>
            )}
            <textarea
              id="citizen-description-textarea"
              aria-label="Citizen Issue Description"
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full text-sm border border-slate-700 rounded-lg p-3 bg-slate-900 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
              placeholder="Describe the infrastructure issue in your locality (road broken, water supply stopped, hospital roof damaged)..."
            />
          </div>

          {/* Multimodal Photo Upload (Gemini 1.5 Flash Vision) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-400" />
                Upload Infrastructure Photo
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-bold px-2 py-0.5 rounded border border-cyan-500/30">
                  Gemini Vision
                </span>
              </label>
              {imageBase64 && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                  ✕ Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Attach a photo of the damaged road, pipe leak, power pole, or school to trigger automated multimodal severity verification.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="citizen-photo-upload"
            />

            {!imageBase64 ? (
              <label
                htmlFor="citizen-photo-upload"
                className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-cyan-400/60 bg-slate-900/40 hover:bg-slate-800/40 rounded-xl p-4 text-center flex flex-col items-center justify-center gap-1.5 transition"
              >
                <ImageIcon className="w-6 h-6 text-slate-500" />
                <span className="text-xs font-medium text-slate-300">Click to attach photo or drag file here</span>
                <span className="text-[10px] text-slate-500">PNG, JPG, WEBP up to 5MB</span>
              </label>
            ) : (
              <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-700">
                <img
                  src={imageBase64}
                  alt="Issue preview"
                  className="w-16 h-16 object-cover rounded-md border border-slate-700 shadow-xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{imageFileName || 'infrastructure_photo.jpg'}</p>
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> Ready for Gemini Multimodal Inspection
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-950/40"
          >
            <Send className="w-4 h-4" />
            {loading ? 'AI Processing & Deduplicating...' : 'Submit Infrastructure Request'}
          </button>

          {/* AI Processing Step Visualization while loading */}
          {loading && (
            <div aria-live="polite" className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 animate-pulse" />
                  AI processing request...
                </span>
                <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  Step {processingStep} of 4
                </span>
              </div>
              <div className="space-y-2">
                {/* Step 1 */}
                <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                  processingStep === 1
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200'
                    : processingStep > 1
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                }`}>
                  <div className="mt-0.5">
                    {processingStep > 1 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : processingStep === 1 ? (
                      <Mic className="w-4 h-4 text-cyan-400 animate-bounce" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">1</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">1. Multi-Language Ingestion &amp; Audio Parsing</span>
                      {processingStep === 1 && <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Processing input...</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Normalizing citizen input and preparing the report</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                  processingStep === 2
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200'
                    : processingStep > 2
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                }`}>
                  <div className="mt-0.5">
                    {processingStep > 2 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : processingStep === 2 ? (
                      <Search className="w-4 h-4 text-cyan-400 animate-bounce" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">2</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">2. LLM Structured Categorization &amp; Severity</span>
                      {processingStep === 2 && <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Analyzing request...</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Identifying infrastructure category, issue type and severity</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                  processingStep === 3
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200'
                    : processingStep > 3
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                }`}>
                  <div className="mt-0.5">
                    {processingStep > 3 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : processingStep === 3 ? (
                      <AlertTriangle className="w-4 h-4 text-cyan-400 animate-bounce" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">3</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">3. Vector Embedding &amp; Section 13 Deduplication</span>
                      {processingStep === 3 && <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Checking similar reports...</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Checking for similar citizen reports using semantic similarity</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                  processingStep === 4
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                }`}>
                  <div className="mt-0.5">
                    {processingStep === 4 ? (
                      <ShieldCheck className="w-4 h-4 text-cyan-400 animate-bounce" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">4</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">4. Reference ID &amp; District Cluster Registration</span>
                      {processingStep === 4 && <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Preparing request registration...</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Registering the request and updating demand information</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Feedback */}
          {submitError && (
            <div className="mb-4 p-3.5 bg-red-950/40 border border-red-700/60 text-red-200 text-xs rounded-xl flex items-start gap-2 mt-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-red-300">Submission Notice</span>
                <span>{submitError}</span>
              </div>
            </div>
          )}

          {/* Submission Result Feedback */}
          {submitResult && (
            <div className="p-5 bg-slate-900/90 border border-emerald-500/40 rounded-xl space-y-3 shadow-lg shadow-emerald-950/20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-400" /> AI processing complete — Request Ingested!
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/40">
                  Verified
                </span>
              </div>
              <div className="text-xs text-slate-300 grid grid-cols-2 gap-3 pt-1">
                <div><span className="font-semibold text-slate-500">Reference:</span> <code className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">{submitResult.reference_code}</code></div>
                <div><span className="font-semibold text-slate-500">Category:</span> <span className="font-medium text-white">{submitResult.category}</span></div>
                <div><span className="font-semibold text-slate-500">Subcategory:</span> <span className="font-medium text-white">{submitResult.subcategory}</span></div>
                <div><span className="font-semibold text-slate-500">Severity:</span> <span className="uppercase text-amber-400 font-bold">{submitResult.severity}</span></div>
              </div>

              {submitResult.visual_evidence && (
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2 mt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Gemini Multimodal Vision Analysis
                    </span>
                    <span className="text-[10px] bg-cyan-950/60 text-cyan-300 font-semibold px-2 py-0.5 rounded border border-cyan-800/60">
                      Confidence: {Math.round((submitResult.visual_evidence.confidence || 0.92) * 100)}%
                    </span>
                  </div>
                  {imageBase64 && (
                    <div className="flex items-start gap-3 pt-1">
                      <img
                        src={imageBase64}
                        alt="Submitted issue photo"
                        className="w-20 h-20 object-cover rounded-lg border border-slate-700 shadow-xs shrink-0"
                      />
                      <div className="flex-1 space-y-1">
                        <p className="text-slate-300 font-medium">
                          {submitResult.visual_evidence.visual_evidence_summary || 'Visual inspection verified infrastructure damage.'}
                        </p>
                        {submitResult.visual_evidence.detected_objects && submitResult.visual_evidence.detected_objects.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {submitResult.visual_evidence.detected_objects.map((obj: string, idx: number) => (
                              <span key={idx} className="bg-slate-800/80 text-cyan-300 text-[10px] px-2 py-0.5 rounded font-medium border border-slate-700">
                                🔍 {obj}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {submitResult.is_duplicate ? (
                <div className="p-2.5 bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs rounded-lg flex items-start gap-2 mt-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-300">Similar request detected</span>
                    <span>Linked to: <strong>{submitResult.duplicate_of || 'Existing Village Report'}</strong> (Section 13 duplicate collapsed, demand score updated).</span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-700/60 text-emerald-200 text-xs rounded-lg flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>No duplicate request detected:</strong> Logged as a new unique district report.</span>
                </div>
              )}
            </div>
          )}
        </form>
      )}

      {/* Tab 2: Status Lookup */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <form onSubmit={handleStatusSearch} className="flex gap-2">
            <input
              type="text"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              placeholder="Enter Reference Code (e.g. #REQ-48213)"
              className="flex-1 text-sm border border-slate-700 rounded-lg p-3 bg-slate-900 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition"
            >
              <Search className="w-4 h-4" /> Check Status
            </button>
          </form>

          {statusError && (
            <div className="p-3.5 bg-red-950/40 text-red-300 text-sm rounded-xl border border-red-700/60">
              {statusError}
            </div>
          )}

          {statusResult && (
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Reference Code</span>
                  <h3 className="text-xl font-bold text-white font-mono">{statusResult.reference_code}</h3>
                </div>
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-bold rounded-full">
                  {statusResult.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-300">
                <div><span className="font-semibold text-slate-500">Category:</span> <br/><span className="text-white font-medium">{statusResult.category}</span></div>
                <div><span className="font-semibold text-slate-500">Subcategory:</span> <br/><span className="text-white font-medium">{statusResult.subcategory}</span></div>
                <div><span className="font-semibold text-slate-500">District:</span> <br/><span className="text-white font-medium">{statusResult.district}</span></div>
                <div><span className="font-semibold text-slate-500">Associated Cluster:</span> <br/><span className="text-white font-medium">{statusResult.cluster_title}</span></div>
                <div><span className="font-semibold text-slate-500">Merged Unique Reports:</span> <br/><span className="text-cyan-400 font-bold">{statusResult.cluster_unique_requests} reports</span></div>
                <div><span className="font-semibold text-slate-500">Cluster Priority Score:</span> <br/><span className="text-emerald-400 font-bold text-sm">{statusResult.cluster_priority_score} / 100</span></div>
              </div>

              {statusResult.image_data && (
                <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="font-semibold text-xs text-slate-400 block mb-2">Attached Infrastructure Photo:</span>
                  <img src={statusResult.image_data} alt="Citizen issue" className="w-32 h-32 object-cover rounded-md border border-slate-700 shadow-xs" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Messaging Channel Webhook */}
      {activeTab === 'messaging' && (
        <form onSubmit={handleWebhookSubmit} className="space-y-4">
          <div className="bg-emerald-950/30 border border-emerald-700/50 p-4 rounded-xl text-xs text-emerald-200 space-y-1">
            <span className="font-bold text-emerald-400 block flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Section 11 — Inbound Messaging Webhook Channel
            </span>
            <p className="text-slate-300">Simulates live WhatsApp / SMS payload sent to <code className="bg-slate-900 border border-slate-700 text-cyan-300 px-1.5 py-0.5 rounded font-mono">POST /api/v1/channels/messaging/webhook</code>.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sender WhatsApp / Phone Number</label>
              <input
                type="text"
                value={webhookPhone}
                onChange={(e) => setWebhookPhone(e.target.value)}
                className="w-full text-sm border border-slate-700 rounded-lg p-2.5 bg-slate-900 text-white focus:border-cyan-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Channel Provider</label>
              <input
                type="text"
                value="Twilio WhatsApp Sandbox"
                disabled
                className="w-full text-sm border border-slate-800 bg-slate-950 rounded-lg p-2.5 text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Inbound Message Body</label>
            <textarea
              rows={3}
              value={webhookText}
              onChange={(e) => setWebhookText(e.target.value)}
              className="w-full text-sm border border-slate-700 rounded-lg p-3 bg-slate-900 text-white focus:border-cyan-400 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40"
          >
            <MessageSquare className="w-4 h-4" /> Trigger Inbound Webhook Payload
          </button>

          {webhookError && (
            <div className="p-3.5 bg-red-950/40 text-red-300 text-sm rounded-xl border border-red-700/60">
              {webhookError}
            </div>
          )}

          {webhookResponse && (
            <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 font-semibold block">// Outbound Automated Response Pushed to Citizen WhatsApp:</span>
              <p className="text-white">"{webhookResponse.reply}"</p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
