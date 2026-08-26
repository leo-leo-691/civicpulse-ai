'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

interface EvidencePanelProps {
  hotspot: any;
}

export default function EvidencePanel({ hotspot }: EvidencePanelProps) {
  if (!hotspot) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
        Select a hotspot cluster on the map to inspect its explainable evidence calculation.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Explainable Evidence Panel (§8)</span>
          <h3 className="text-lg font-bold text-slate-900">{hotspot.title}</h3>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500">Priority Score</span>
          <div className="text-2xl font-black text-blue-700">{hotspot.priority_score} <span className="text-xs text-slate-400 font-normal">/ 100</span></div>
        </div>
      </div>

      {/* Under Reported Digital Divide Banner */}
      {hotspot.is_under_reported && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-bold block">Section 7 Digital-Access Bias Correction Applied (+{hotspot.digital_access_correction} Points)</span>
            <p>
              This region exhibits severe infrastructure gaps but low mobile/digital penetration (38%). Without correction, demand-weighted scoring would systematically favor urban/connected citizens. Upward correction applied; flagged for field verification.
            </p>
          </div>
        </div>
      )}

      {/* Evidence Bullets */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase text-slate-700">Audit Evidence & Calculation Breakdown:</h4>
        <ul className="space-y-1.5 text-xs text-slate-700">
          {hotspot.evidence.map((bullet: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-100">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1">
        <Info className="w-3.5 h-3.5" /> Deterministic calculation computed by Priority Engine. LLM explanations derived strictly from computed numbers.
      </div>
    </div>
  );
}
