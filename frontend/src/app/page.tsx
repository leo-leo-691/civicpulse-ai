'use client';

import React, { useState } from 'react';
import CitizenPortal from '@/components/CitizenPortal';
import PolicymakerDashboard from '@/components/PolicymakerDashboard';
import { Shield, Users, LayoutDashboard, Globe2 } from 'lucide-react';

export default function Home() {
  const [view, setView] = useState<'citizen' | 'policymaker'>('policymaker');

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white py-3.5 px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xl text-white shadow-inner">
              CP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg leading-none tracking-tight">CivicPulse AI</h1>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                  BRICS Innovation v2
                </span>
              </div>
              <p className="text-xs text-slate-400">Digital Public Infrastructure & Governance</p>
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setView('policymaker')}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-md transition ${
                view === 'policymaker' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Policymaker Dashboard
            </button>
            <button
              onClick={() => setView('citizen')}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-md transition ${
                view === 'citizen' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Citizen Voice Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {view === 'policymaker' ? <PolicymakerDashboard /> : <CitizenPortal />}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>CivicPulse AI — Digital Public Good (Apache License 2.0)</span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <Globe2 className="w-4 h-4 text-blue-600" /> Multi-Country BRICS Compatible Architecture
          </span>
        </div>
      </footer>
    </main>
  );
}
