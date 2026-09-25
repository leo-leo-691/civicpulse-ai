'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Hotspot } from '@/lib/api';
import { Layers, MapPin, AlertTriangle } from 'lucide-react';

interface MapViewProps {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
}

// Dynamically import the Leaflet map container to disable SSR and prevent window/document errors
const LeafletMap = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] bg-slate-900 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-800">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-medium">Loading OpenStreetMap GIS Tiles...</span>
    </div>
  ),
});

export default function MapView({ hotspots, selectedHotspot, onSelectHotspot }: MapViewProps) {
  return (
    <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col p-4 text-white space-y-4">
      {/* Map Header & Legend */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-800">
        <div>
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            GIS Geospatial Hotspot Map — PostGIS Layer
          </h3>
          <p className="text-xs text-slate-400">
            Maharashtra Administrative Units (Pune &amp; Gadchiroli)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
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

      {/* Real Interactive Leaflet GIS Map Container */}
      <div className="w-full h-[360px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950 relative">
        <LeafletMap
          hotspots={hotspots}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={onSelectHotspot}
        />
      </div>

      {/* Interactive Cluster Selector Cards (Preserved for easy multi-view selection) */}
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
                    📍 {spot.affected_villages} Villages |{' '}
                    {spot.estimated_population.toLocaleString()} Population
                  </p>
                  <p>
                    📊 {spot.total_request_count} Reports ({spot.unique_request_count} Unique after
                    Dedup)
                  </p>
                </div>

                {spot.is_under_reported && (
                  <div className="mt-2.5 text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-1 rounded flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Section 7 Digital Divide Boost: +{spot.digital_access_correction} pts</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Map Status Footer */}
      <div className="text-[10px] text-slate-400 flex justify-between items-center px-1">
        <span>Click markers or cards to focus cluster in Evidence Panel</span>
        <span>Coordinates EPSG:4326 WGS84 | Leaflet &amp; OpenStreetMap</span>
      </div>
    </div>
  );
}
