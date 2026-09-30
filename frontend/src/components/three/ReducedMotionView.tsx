'use client';

import React from 'react';
import Link from 'next/link';
import {
  Mic,
  Cpu,
  MapPin,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BarChart3,
  Users
} from 'lucide-react';

export default function ReducedMotionView() {
  return (
    <div className="min-h-screen bg-[#060913] text-white flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full text-xs font-mono text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Accessible Narrative Mode (Motion Reduced)
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl mx-auto">
            Democratizing Public Infrastructure Intelligence with AI
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            From vernacular voice complaints in remote tribal hamlets to evidence-based budget allocation in the District Collector&apos;s office.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/citizen"
              className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-2 transition shadow-[0_0_20px_rgba(0,229,255,0.3)]"
            >
              <Users className="w-4 h-4" /> Enter Citizen Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 flex items-center gap-2 transition"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Policymaker Dashboard
            </Link>
          </div>
        </div>

        {/* 5 Story Beats in Static Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Beat 1 */}
          <div className="bg-[#0c1222]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
              Beat 1: The Citizen Voice
            </span>
            <h3 className="text-lg font-bold text-white">Scattered Distress Signals</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Citizens in remote villages describe water pipe fractures, broken roads, or power outages in Marathi, Hindi, or Portuguese via speech or text.
            </p>
          </div>

          {/* Beat 2 */}
          <div className="bg-[#0c1222]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-purple-400 uppercase tracking-widest block font-bold">
              Beat 2: AI Understanding
            </span>
            <h3 className="text-lg font-bold text-white">Multimodal Extraction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google Gemini 3.8 Flash extracts categories, urgency scores, and verifies photo damage, filtering out spam and stock imagery automatically.
            </p>
          </div>

          {/* Beat 3 */}
          <div className="bg-[#0c1222]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-blue-400 uppercase tracking-widest block font-bold">
              Beat 3: Spatial Convergence
            </span>
            <h3 className="text-lg font-bold text-white">DBSCAN Geospatial Clustering</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Thousands of disparate citizen reports cluster geographically onto census village boundaries, revealing unseen infrastructure failure hotspots.
            </p>
          </div>

          {/* Beat 4 */}
          <div className="bg-[#0c1222]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
              Beat 4: Explainable Priority
            </span>
            <h3 className="text-lg font-bold text-white">Digital-Divide Correction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A mathematical fairness correction adds up to +15 priority points to low-connectivity tribal blocks, preventing smartphone-rich urban bias.
            </p>
          </div>

          {/* Beat 5 */}
          <div className="bg-[#0c1222]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 md:col-span-2 lg:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">
              Beat 5: Human Governance
            </span>
            <h3 className="text-lg font-bold text-white">Actionable Policy Sanction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              District Magistrates review synthesized evidence, simulated budget impacts, and approve capital works with full audit traceability (§29).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
