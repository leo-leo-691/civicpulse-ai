'use client';

import React from 'react';
import { Globe2, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#060913] text-slate-400 text-xs py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">CivicPulse AI</span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded font-mono">
                Track 1: AI for Digital Public Infrastructure &amp; Governance
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Multilingual, explainable decision-support platform grounded in transparent digital-divide correction.
            </p>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              DPG Standard Compliant • Apache License 2.0 • Synthetic data disclosed per project integrity principles
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Globe2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>BRICS Multi-Region Architecture (India • Brazil • South Africa extensible)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
