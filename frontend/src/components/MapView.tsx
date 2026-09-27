'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Hotspot } from '@/lib/api';
import { Globe } from 'lucide-react';

interface MapViewProps {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
}

const GoogleMap = dynamic(() => import('./GoogleMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] bg-slate-900 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-800">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-medium">Loading Google Maps Platform...</span>
    </div>
  ),
});

export default function MapView({ hotspots, selectedHotspot, onSelectHotspot }: MapViewProps) {
  const hasApiKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  return (
    <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col p-4 text-white space-y-4">
      {/* Map Header & Legend */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Google Maps Platform — Geospatial Hotspot Engine
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              hasApiKey
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {hasApiKey ? 'Google Maps JS SDK' : 'Satellite Embed Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {hasApiKey
              ? 'Interactive Satellite, Terrain, & Roadmap visualization for regional demand hotspots'
              : 'Satellite embed mode active (API key not configured in .env; interactive overlays active)'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/30"></span>
            <span className="text-slate-300">High Priority (&ge;80)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300">Medium (&ge;60)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/50"></span>
            <span className="text-slate-300">Selected</span>
          </span>
        </div>
      </div>

      {/* Interactive Google Map Viewport */}
      <div className="w-full h-[380px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950 relative">
        <GoogleMap
          hotspots={hotspots}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={onSelectHotspot}
        />
      </div>

      {/* Interactive Cluster Selector Cards */}
      {hotspots && hotspots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {hotspots.map((spot) => {
            const isSelected = selectedHotspot?.id === spot.id;
            return (
              <div
                key={spot.id}
                onClick={() => onSelectHotspot(spot)}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-blue-950/60 border-blue-400 ring-2 ring-blue-500/50 shadow-md'
                    : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      {spot.district} District • {spot.category}
                    </span>
                    <h4 className="font-bold text-sm text-white leading-snug">{spot.title}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded ${
                      spot.priority_score >= 80
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-extrabold'
                        : spot.priority_score >= 60
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {spot.priority_score} / 100
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-0.5">
                  <p>
                    <span className="text-slate-400">Unique Citizen Reports:</span>{' '}
                    <strong className="text-white">{spot.unique_request_count.toLocaleString()}</strong>
                    <span className="text-slate-500 ml-1">({spot.total_request_count.toLocaleString()} total mentions)</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Est. Population Impacted:</span>{' '}
                    <strong className="text-white">{spot.estimated_population.toLocaleString()} citizens</strong>
                  </p>
                  {spot.digital_access_correction > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-[11px] font-medium">
                      <span>✓ Digital Divide Boost: +{spot.digital_access_correction} points</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
