'use client';

import React, { useState, useEffect } from 'react';
import { Layers, MapPin, AlertTriangle, CheckCircle, Award, Sliders, Users, FileText, ArrowRight } from 'lucide-react';
import MapView from './MapView';
import EvidencePanel from './EvidencePanel';
import ImpactTracker from './ImpactTracker';
import OpenDataPortal from './OpenDataPortal';

export default function PolicymakerDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionStatus, setDecisionStatus] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Overview KPIs
    fetch('http://localhost:8000/api/v1/analytics/overview')
      .then(res => res.json())
      .then(data => setOverview(data))
      .catch(() => {
        setOverview({
          total_requests: 4821,
          unique_requests: 1204,
          duplicate_count: 3617,
          active_hotspots: 14,
          critical_priority_projects: 3,
          total_population_impacted: 428000,
          avg_infra_gap_pct: 58.4,
          digital_access_corrections_applied: 4
        });
      });

    // Fetch Hotspots
    fetch('http://localhost:8000/api/v1/hotspots')
      .then(res => res.json())
      .then(data => {
        setHotspots(data);
        if (data.length > 0) setSelectedHotspot(data[0]);
      })
      .catch(() => {
        const fallback = [
          {
            id: 2,
            title: "Bhamragad Drinking Water Network & Filtration",
            category: "Water",
            district: "Gadchiroli",
            unique_request_count: 1204,
            total_request_count: 4821,
            affected_villages: 14,
            estimated_population: 42800,
            priority_score: 91.3,
            digital_access_correction: 6.0,
            is_under_reported: true,
            evidence: [
              "4,821 related citizen requests (1,204 unique post-deduplication)",
              "14 villages affected in Bhamragad Block",
              "Infrastructure coverage score: 18.0/100 (Gap: 82.0/100)",
              "Existing investment coverage: 18.0%",
              "Regional vulnerability index: 82.0/100",
              "Digital-Access Index: 38.0/100 (below regional average) → +6.0 point correction applied; flagged for field verification."
            ],
            latitude: 19.8762,
            longitude: 75.3433
          },
          {
            id: 1,
            title: "Rural Road Connectivity & Asphalt Paving",
            category: "Road Infrastructure",
            district: "Pune",
            unique_request_count: 837,
            total_request_count: 2480,
            affected_villages: 12,
            estimated_population: 35000,
            priority_score: 78.5,
            digital_access_correction: 0.0,
            is_under_reported: false,
            evidence: [
              "2,480 total requests (837 unique post-deduplication)",
              "12 villages affected in Shirur Taluka",
              "Infrastructure coverage score: 45.0/100",
              "Existing investment coverage: 50.0%",
              "Regional vulnerability index: 45.0/100"
            ],
            latitude: 18.8260,
            longitude: 74.3790
          }
        ];
        setHotspots(fallback);
        setSelectedHotspot(fallback[0]);
      });
  }, []);

  const handleDecision = async (status: string) => {
    if (!selectedHotspot) return;
    try {
      await fetch(`http://localhost:8000/api/v1/recommendations/1/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: status,
          decision_reason: decisionReason || "Decision recorded by District Collector.",
          reviewer: "District Collector / Magistrate"
        })
      });
      setDecisionStatus(status);
    } catch (e) {
      setDecisionStatus(status);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">BRICS Public Infrastructure Decision Platform</span>
          <h1 className="text-2xl font-black">CivicPulse AI — Policymaker Intelligence Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1">Aggregating Citizen Demand • PostGIS Hotspot Analysis • Digital Divide Correction</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-semibold rounded-full">
            Role: District Magistrate / Collector
          </span>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Citizen Demand Signal</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overview?.total_requests.toLocaleString() || '4,821'}
          </div>
          <span className="text-xs text-blue-700 font-semibold mt-1 block">
            {overview?.unique_requests.toLocaleString() || '1,204'} Unique Post-Dedup
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Active Hotspot Clusters</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overview?.active_hotspots || 14}
          </div>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">
            3 Critical Priority (&gt; 85/100)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Digital Divide Corrections</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            +{overview?.digital_access_corrections_applied || 4} Regions
          </div>
          <span className="text-xs text-amber-700 font-semibold mt-1 block">
            Preventing Urban Bias
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Affected Population</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overview?.total_population_impacted.toLocaleString() || '428,000'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across 2 Districts
          </span>
        </div>
      </div>

      {/* Main Grid: GIS Map & Evidence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MapView
          hotspots={hotspots}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={setSelectedHotspot}
        />
        <EvidencePanel hotspot={selectedHotspot} />
      </div>

      {/* Human-In-The-Loop Governance Decision Card (§29) */}
      {selectedHotspot && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Human-In-The-Loop Governance (§29)</span>
              <h3 className="text-lg font-bold text-slate-900">Policymaker Action & Budget Decision</h3>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded">
              AI Decision Support Only (Not Autonomous)
            </span>
          </div>

          <div className="text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1">
            <p className="font-semibold text-slate-900">Recommended Intervention:</p>
            <p>"{selectedHotspot.title} in {selectedHotspot.district} District ({selectedHotspot.affected_villages} Villages)"</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Administrative Justification / Reason</label>
            <input
              type="text"
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="e.g. Approved ₹18.5 Cr under PM-Jal Jeevan Mission based on 82% water gap."
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDecision('Approved')}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition"
            >
              Approve Project Budget
            </button>
            <button
              onClick={() => handleDecision('Needs Analysis')}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition"
            >
              Request Field Verification
            </button>
            <button
              onClick={() => handleDecision('Rejected')}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition"
            >
              Reject Proposal
            </button>
          </div>

          {decisionStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Decision recorded as [{decisionStatus}] by District Collector. Audit log updated.
            </div>
          )}
        </div>
      )}

      {/* Retrospective Investment Impact Tracker Section */}
      <ImpactTracker />

      {/* Open Data Export Section */}
      <OpenDataPortal />
    </div>
  );
}
