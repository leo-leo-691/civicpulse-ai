'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hotspot } from '@/lib/api';
import { AlertTriangle, MapPin } from 'lucide-react';

interface LeafletMapInnerProps {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
}

/**
 * Helper component that auto-centers/bounds the map based on hotspots or selection
 */
function MapBoundsUpdater({
  hotspots,
  selectedHotspot,
}: {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
}) {
  const map = useMap();

  // Fit bounds to all hotspots when loaded
  useEffect(() => {
    if (hotspots && hotspots.length > 0) {
      const validPoints = hotspots
        .filter(
          (h) =>
            typeof h.latitude === 'number' &&
            !isNaN(h.latitude) &&
            typeof h.longitude === 'number' &&
            !isNaN(h.longitude)
        )
        .map((h) => [h.latitude, h.longitude] as [number, number]);

      if (validPoints.length === 1) {
        map.setView(validPoints[0], 9);
      } else if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 10 });
      }
    }
  }, [hotspots, map]);

  // Pan to selected hotspot when clicked
  useEffect(() => {
    if (
      selectedHotspot &&
      typeof selectedHotspot.latitude === 'number' &&
      typeof selectedHotspot.longitude === 'number'
    ) {
      map.panTo([selectedHotspot.latitude, selectedHotspot.longitude], {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedHotspot, map]);

  return null;
}

/**
 * Determines visual style of CircleMarker based on priority score and selection
 */
function getMarkerStyle(hotspot: Hotspot, isSelected: boolean) {
  const score = hotspot.priority_score;
  let strokeColor = '#3b82f6';
  let fillColor = '#60a5fa';

  if (score >= 80) {
    // Critical / High Priority (>= 80)
    strokeColor = '#dc2626';
    fillColor = '#ef4444';
  } else if (score >= 60) {
    // Medium / High Priority (>= 60)
    strokeColor = '#d97706';
    fillColor = '#f59e0b';
  }

  return {
    radius: isSelected ? 16 : score >= 80 ? 13 : 11,
    pathOptions: {
      color: isSelected ? '#38bdf8' : strokeColor,
      fillColor: fillColor,
      fillOpacity: isSelected ? 0.95 : 0.82,
      weight: isSelected ? 4 : 2,
    },
  };
}

export default function LeafletMapInner({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
}: LeafletMapInnerProps) {
  // Default Center on Maharashtra (Lat: 18.95, Lng: 75.8)
  const defaultCenter: [number, number] = [18.95, 75.8];
  const defaultZoom = 7;

  return (
    <div className="relative w-full h-full min-h-[360px] rounded-lg overflow-hidden z-0">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[360px]"
        style={{ width: '100%', height: '100%', minHeight: '360px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater hotspots={hotspots} selectedHotspot={selectedHotspot} />

        {hotspots.map((spot) => {
          if (typeof spot.latitude !== 'number' || typeof spot.longitude !== 'number') {
            return null;
          }

          const isSelected = selectedHotspot?.id === spot.id;
          const { radius, pathOptions } = getMarkerStyle(spot, isSelected);

          return (
            <CircleMarker
              key={spot.id}
              center={[spot.latitude, spot.longitude]}
              radius={radius}
              pathOptions={pathOptions}
              eventHandlers={{
                click: () => onSelectHotspot(spot),
              }}
            >
              <Popup className="civicpulse-popup">
                <div className="p-1 min-w-[210px] text-slate-900">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      {spot.district} District
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                        spot.priority_score >= 80
                          ? 'bg-red-100 text-red-700 font-extrabold'
                          : spot.priority_score >= 60
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {spot.priority_score} / 100
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 leading-snug mb-1">
                    {spot.title}
                  </h4>

                  <div className="text-[11px] text-slate-600 space-y-0.5 mb-2">
                    <p>
                      <strong>Category:</strong> {spot.category}
                    </p>
                    <p>
                      📍 <strong>Villages:</strong> {spot.affected_villages}
                    </p>
                    <p>
                      👥 <strong>Population:</strong>{' '}
                      {spot.estimated_population.toLocaleString()}
                    </p>
                    <p>
                      📊 <strong>Reports:</strong> {spot.total_request_count} (
                      {spot.unique_request_count} unique)
                    </p>
                  </div>

                  {spot.is_under_reported && (
                    <div className="mb-2 p-1.5 bg-amber-50 border border-amber-300 rounded text-[10px] text-amber-900 font-semibold flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>Section 7 Boost: +{spot.digital_access_correction} pts</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectHotspot(spot)}
                    className={`w-full py-1 px-2 text-[11px] font-semibold rounded transition text-center ${
                      isSelected
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {isSelected ? '✓ Active Cluster in Evidence Panel' : 'Select Cluster'}
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {hotspots.length === 0 && (
        <div className="absolute top-3 left-14 z-[400] bg-slate-900/90 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 shadow-md">
          Base Map Active • No cluster hotspots loaded
        </div>
      )}
    </div>
  );
}
