'use client';

import React from 'react';

interface MapViewProps {
  hotspots: any[];
  selectedHotspot: any;
  onSelectHotspot: (hotspot: any) => void;
}

export default function MapView({ hotspots, selectedHotspot, onSelectHotspot }: MapViewProps) {
  return (
    <div className="relative w-full h-[400px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-4 text-white">
      {/* Map Header */}
      <div className="flex justify-between items-center z-10 bg-slate-900/80 backdrop-blur p-3 rounded-lg border border-slate-800">
        <div>
          <h3 className="font-bold text-sm text-slate-100">GIS Geospatial Hotspot Map — PostGIS Layer</h3>
          <p className="text-xs text-slate-400">Maharashtra Administrative Units (Pune & Gadchiroli)</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> High Priority Hotspot</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Digital Divide Boosted</span>
        </div>
      </div>

      {/* Simulated Interactive Map Markers Canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
      
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 my-auto px-4">
        {hotspots.map((spot) => {
          const isSelected = selectedHotspot?.id === spot.id;
          return (
            <div
              key={spot.id}
              onClick={() => onSelectHotspot(spot)}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-blue-900/40 border-blue-400 ring-2 ring-blue-500/50 shadow-lg'
                  : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{spot.district} District</span>
                  <h4 className="font-bold text-sm text-white">{spot.title}</h4>
                </div>
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                  spot.priority_score >= 85 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {spot.priority_score} / 100
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <p>📍 {spot.affected_villages} Villages | {spot.estimated_population.toLocaleString()} Population</p>
                <p>📊 {spot.total_request_count} Reports ({spot.unique_request_count} Unique after Dedup)</p>
              </div>

              {spot.is_under_reported && (
                <div className="mt-3 text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-1 rounded">
                  ⚠️ Section 7 Digital Divide Boost: +{spot.digital_access_correction} pts
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="z-10 text-[10px] text-slate-500 text-right">
        Coordinates EPSG:4326 WGS84 | Leaflet OpenStreetMap Layer Active
      </div>
    </div>
  );
}
