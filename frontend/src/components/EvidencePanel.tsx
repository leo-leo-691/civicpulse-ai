'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { Hotspot } from '@/lib/api';

interface EvidencePanelProps {
  hotspot: Hotspot | null;
}

export default function EvidencePanel({ hotspot }: EvidencePanelProps) {
  if (!hotspot) {
    return (
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
        Select a hotspot cluster on the map to inspect its explainable evidence calculation.
      </div>
    );
  }

  return (
    <div className="bg-[#0c1222]/90 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100 backdrop-blur-md space-y-4">
      <div className="border-b border-slate-800/80 pb-3 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Explainable Evidence Panel (§8)</span>
          <h3 className="text-lg font-bold text-white tracking-tight">{hotspot.title}</h3>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400">Priority Score</span>
          <div className="text-2xl font-black text-cyan-400 font-mono">{hotspot.priority_score} <span className="text-xs text-slate-500 font-normal">/ 100</span></div>
        </div>
      </div>

      {/* Under Reported Digital Divide Banner */}
      {hotspot.is_under_reported && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200 space-y-1">
            <span className="font-bold text-amber-300 block">Section 7 Digital-Access Bias Correction Applied (+{hotspot.digital_access_correction} Points)</span>
            <p className="text-slate-300">
              This region exhibits severe infrastructure gaps but low mobile/digital penetration (38%). Without correction, demand-weighted scoring would systematically favor urban/connected citizens. Upward correction applied; flagged for field verification.
            </p>
          </div>
        </div>
      )}

      {/* Evidence Bullets */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider">Audit Evidence &amp; Calculation Breakdown:</h4>
        <ul className="space-y-1.5 text-xs text-slate-300">
          {hotspot.evidence.map((bullet: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 border-t border-slate-800/60">
        <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
        <span>Deterministic calculation computed by Priority Engine. LLM explanations derived strictly from computed numbers.</span>
      </div>
    </div>
  );
}
