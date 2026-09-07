'use client';

import React, { useState } from 'react';
import { Mic, Send, MessageSquare, Search, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<CitizenRequestResponse | null>(null);

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

    try {
      const data = await submitCitizenRequest({
        raw_text: inputText,
        channel: channel,
        language: language,
        district: district,
        locality: locality,
        reporter_contact_hash: "web_user_hash"
      });
      setSubmitResult(data);
    } catch (err) {
      // Mock fallback for UI demo if backend server offline
      setSubmitResult({
        status: "success",
        reference_code: `#REQ-${Math.floor(10000 + Math.random() * 90000)}`,
        is_duplicate: false,
        category: "Road Infrastructure",
        subcategory: "Rural Road Connectivity",
        severity: "high",
        message: "Your request has been received and processed."
      });
    } finally {
      setLoading(false);
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
      // Demo mock match for #REQ-48213 or #REQ-48214
      if (searchRef.toUpperCase() === '#REQ-48213' || searchRef.toUpperCase() === '#REQ-48214') {
        setStatusResult({
          reference_code: searchRef.toUpperCase(),
          status: "Under Review by District Officer",
          category: searchRef.toUpperCase() === '#REQ-48213' ? "Road Infrastructure" : "Water",
          subcategory: searchRef.toUpperCase() === '#REQ-48213' ? "Rural Road Connectivity" : "Drinking Water Supply",
          district: searchRef.toUpperCase() === '#REQ-48213' ? "Pune" : "Gadchiroli",
          locality: "Bhamragad / Shirur Block",
          cluster_title: "District Infrastructure Priority Initiative",
          cluster_unique_requests: 1204,
          cluster_priority_score: 91.3,
          created_at: new Date().toISOString()
        });
      } else {
        setStatusError("Request reference code not found. Please check #REQ-XXXXX format.");
      }
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
    } catch (err) {
      setWebhookResponse({
        status: "received",
        reply: "Thank you. Your WhatsApp report has been logged under #REQ-89210 and merged into district priority cluster."
      });
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetLang: string, presetText: string) => {
    setLanguage(presetLang);
    setInputText(presetText);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CivicPulse AI — Citizen Voice Portal</h1>
          <p className="text-slate-600 text-sm">Tell us what your community needs. Audio, text, and WhatsApp supported.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4" /> Digital Public Good
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-4">
        <button
          onClick={() => setActiveTab('submit')}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'submit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🎤 Submit Request
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'status' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🔍 Check Request Status
        </button>
        <button
          onClick={() => setActiveTab('messaging')}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'messaging' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💬 WhatsApp / SMS Channel Demo
        </button>
      </div>

      {/* Tab 1: Submit Request */}
      {activeTab === 'submit' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quick Presets for Demo */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
            <span className="font-semibold text-slate-700 block">⚡ Multilingual Demo Presets:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset('en', 'Our village road is completely broken and ambulances cannot reach during emergencies.')}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100"
              >
                🇬🇧 English Text
              </button>
              <button
                type="button"
                onClick={() => setPreset('hi', 'हमारे गांव में पिछले तीन साल से पीने का पानी नहीं आ रहा है। बच्चे बीमार हैं।')}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100"
              >
                🇮🇳 Hindi Report
              </button>
              <button
                type="button"
                onClick={() => setPreset('mr', 'आमच्या गावातील रस्ता अत्यंत खराब झाला आहे, शाळा सुटल्यावर मुले घरी येऊ शकत नाहीत.')}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100"
              >
                🇮🇳 Marathi Report
              </button>
              <button
                type="button"
                onClick={() => setPreset('pt', 'Nossa vila não tem água potável há três anos. As crianças estão sofrendo.')}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100"
              >
                🇧🇷 Portuguese (BRICS Demo)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
              >
                <option value="en">English (English)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="pt">Portuguese (Português - BRICS)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
              >
                <option value="Pune">Pune (High Connectivity)</option>
                <option value="Gadchiroli">Gadchiroli (Low Mobile Access - Under-Reported)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Locality / Village</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2"
                placeholder="Village or Town Name"
              />
            </div>
          </div>

          {/* Voice vs Text toggle */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">Citizen Description (Voice or Text)</label>
              <button
                type="button"
                onClick={() => setIsRecording(!isRecording)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded transition ${
                  isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                {isRecording ? 'Stop Recording (Listening...)' : 'Record Audio'}
              </button>
            </div>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Describe the infrastructure issue in your locality..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Send className="w-4 h-4" />
            {loading ? 'AI Processing & Deduplicating...' : 'Submit Infrastructure Request'}
          </button>

          {/* Submission Result Feedback */}
          {submitResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle className="w-5 h-5" /> Request Successfully Ingested!
              </div>
              <div className="text-xs text-slate-700 grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200">
                <div><span className="font-semibold">Reference Code:</span> <code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900">{submitResult.reference_code}</code></div>
                <div><span className="font-semibold">Extracted Category:</span> {submitResult.category}</div>
                <div><span className="font-semibold">Extracted Subcategory:</span> {submitResult.subcategory}</div>
                <div><span className="font-semibold">AI Severity Level:</span> <span className="uppercase text-amber-700 font-bold">{submitResult.severity}</span></div>
              </div>
              {submitResult.is_duplicate && (
                <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <strong>Section 13 Duplicate Collapsed:</strong> Matches existing request ({submitResult.duplicate_of}). Count incremented, demand score updated.
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
              className="flex-1 text-sm border border-slate-300 rounded-lg p-2.5"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Check Status
            </button>
          </form>

          {statusError && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {statusError}
            </div>
          )}

          {statusResult && (
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-lg space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Reference Code</span>
                  <h3 className="text-lg font-bold text-slate-900">{statusResult.reference_code}</h3>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                  {statusResult.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-700">
                <div><span className="font-semibold text-slate-500">Category:</span> <br/>{statusResult.category}</div>
                <div><span className="font-semibold text-slate-500">Subcategory:</span> <br/>{statusResult.subcategory}</div>
                <div><span className="font-semibold text-slate-500">District:</span> <br/>{statusResult.district}</div>
                <div><span className="font-semibold text-slate-500">Associated Cluster:</span> <br/>{statusResult.cluster_title}</div>
                <div><span className="font-semibold text-slate-500">Merged Unique Reports:</span> <br/>{statusResult.cluster_unique_requests} reports</div>
                <div><span className="font-semibold text-slate-500">Cluster Priority Score:</span> <br/><span className="text-emerald-700 font-bold">{statusResult.cluster_priority_score} / 100</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Messaging Channel Webhook */}
      {activeTab === 'messaging' && (
        <form onSubmit={handleWebhookSubmit} className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-xs text-emerald-900 space-y-1">
            <span className="font-bold block">Section 11 — Inbound Messaging Webhook Channel</span>
            <p>Simulates live WhatsApp / SMS payload sent to <code className="bg-emerald-100 px-1 py-0.5 rounded">POST /api/v1/channels/messaging/webhook</code>.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sender WhatsApp / Phone Number</label>
              <input
                type="text"
                value={webhookPhone}
                onChange={(e) => setWebhookPhone(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Channel Provider</label>
              <input
                type="text"
                value="Twilio WhatsApp Sandbox"
                disabled
                className="w-full text-sm border border-slate-200 bg-slate-100 rounded-lg p-2 text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Inbound Message Body</label>
            <textarea
              rows={3}
              value={webhookText}
              onChange={(e) => setWebhookText(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" /> Trigger Inbound Webhook Payload
          </button>

          {webhookResponse && (
            <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg space-y-1">
              <span className="text-slate-400 font-semibold block">// Outbound Automated Response Pushed to Citizen WhatsApp:</span>
              <p className="text-white">"{webhookResponse.reply}"</p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
