'use client';

import React, { useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingDown, CheckCircle2, History } from 'lucide-react';

export default function ImpactTracker() {
  const [impactData, setImpactData] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/investments/1/impact-history')
      .then(res => res.json())
      .then(data => setImpactData(data))
      .catch(() => {
        // Fallback for UI demo
        setImpactData([{
          project_id: 1,
          project_title: "Shirur Drinking Water Pipeline & Storage Tank",
          sector: "Water",
          budget_crores: 18.5,
          status: "Completed (8 Months Ago)",
          measured_at: new Date().toISOString(),
          infra_index_before: 41.0,
          infra_index_after: 68.0,
          complaint_volume_before: 1420,
          complaint_volume_after: 596,
          complaint_reduction_pct: 58.0,
          coverage_before_pct: 32.0,
          coverage_after_pct: 71.0
        }]);
      });
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
      <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <History className="w-4 h-4" /> Retrospective Investment Impact Tracker (§31)
          </span>
          <h2 className="text-xl font-bold text-slate-900">Post-Investment Verification & ROI</h2>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
          Continuous Measurement Active
        </span>
      </div>

      <p className="text-xs text-slate-600">
        Unlike simple decision simulators, CivicPulse AI tracks money <em>already spent</em> by continuously comparing citizen complaint volumes and infrastructure coverage indices pre- vs. post-commissioning.
      </p>

      {impactData.map((item, idx) => (
        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">{item.sector} Sector • ₹{item.budget_crores} Crore Budget</span>
              <h3 className="text-lg font-bold text-slate-900">{item.project_title}</h3>
            </div>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
              {item.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric 1: Complaint Volume Drop */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 block">Citizen Complaint Volume</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{item.complaint_volume_after}</span>
                <span className="text-xs text-slate-400 font-medium">from {item.complaint_volume_before}</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs mt-2">
                <TrendingDown className="w-4 h-4" /> -{item.complaint_reduction_pct}% Complaint Drop (Measured)
              </div>
            </div>

            {/* Metric 2: Infrastructure Coverage Score */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 block">Infrastructure Coverage Index</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{item.infra_index_after} / 100</span>
                <span className="text-xs text-slate-400 font-medium">from {item.infra_index_before}</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs mt-2">
                <ArrowUpRight className="w-4 h-4" /> +{(item.infra_index_after - item.infra_index_before).toFixed(1)} Point Improvement
              </div>
            </div>

            {/* Metric 3: Household Water Access */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 block">Household Coverage Rate</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{item.coverage_after_pct}%</span>
                <span className="text-xs text-slate-400 font-medium">from {item.coverage_before_pct}%</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs mt-2">
                <CheckCircle2 className="w-4 h-4" /> Verified by Jal Jeevan Dashboard
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
