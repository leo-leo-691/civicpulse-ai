'use client';

import React from 'react';
import Link from 'next/link';
import { Globe2, ShieldCheck, Terminal, Heart } from 'lucide-react';

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

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/citizen" className="hover:text-cyan-400 transition">
              Citizen Portal
            </Link>
            <Link href="/dashboard" className="hover:text-cyan-400 transition">
              Policymaker Dashboard
            </Link>
            <Link href="/admin" className="hover:text-cyan-400 transition">
              Operations Control
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              FastAPI OpenAPI Docs
            </a>
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
