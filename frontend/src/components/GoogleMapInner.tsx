'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Hotspot } from '@/lib/api';
import { MapPin } from 'lucide-react';

interface GoogleMapInnerProps {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
  apiKey?: string;
}

declare global {
  interface Window {
    google?: any;
    gm_authFailure?: () => void;
  }
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
}

declare const process: { env: Record<string, string | undefined> };

export default function GoogleMapInner({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  apiKey,
}: GoogleMapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);

  const effectiveKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!effectiveKey) return;

    // Gracefully catch Google Maps auth failure (e.g. unactivated API or domain restriction)
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps API auth warning: falling back to Google Maps interactive embed.");
      setMapError(true);
    };

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script-civicpulse';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${effectiveKey}&libraries=visualization`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => setMapError(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, [effectiveKey]);

  useEffect(() => {
    if (mapError || !mapLoaded || !mapContainerRef.current || !window.google || !window.google.maps) {
      return;
    }

    try {
      if (!mapInstanceRef.current) {
        // Initialize Google Map centered on Maharashtra, India
        mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: 19.25, lng: 75.0 },
        zoom: 7,
        mapTypeId: 'terrain',
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }],
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#38414e' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#746855' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }],
          },
        ],
      });
    }

    // Clear previous markers & circles
    markersRef.current.forEach((m: any) => m.setMap(null));
    circlesRef.current.forEach((c: any) => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    // Add Hotspot markers & circular demand buffers
    hotspots.forEach((spot) => {
      const position = { lat: spot.latitude, lng: spot.longitude };
      const isSelected = selectedHotspot?.id === spot.id;
      const fillColor = isSelected
        ? '#22d3ee'
        : spot.priority_score >= 80
        ? '#ef4444'
        : spot.priority_score >= 60
        ? '#f59e0b'
        : '#3b82f6';

      // Circular coverage buffer
      const circle = new window.google.maps.Circle({
        strokeColor: fillColor,
        strokeOpacity: 0.8,
        strokeWeight: isSelected ? 3 : 1.5,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.35 : 0.2,
        map: mapInstanceRef.current,
        center: position,
        radius: Math.min(30000, 10000 + spot.unique_request_count * 15),
      });
      circlesRef.current.push(circle);

      // Custom SVG Marker Icon
      const marker = new window.google.maps.Marker({
        position: position,
        map: mapInstanceRef.current,
        title: `${spot.title} (${spot.priority_score}/100)`,
        animation: isSelected ? window.google.maps.Animation.BOUNCE : null,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 11 : 8,
          fillColor: fillColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="color: #0f172a; padding: 6px; font-family: sans-serif; font-size: 12px; max-width: 240px;">
            <strong style="font-size: 13px; color: #1e293b; display: block; margin-bottom: 4px;">${spot.title}</strong>
            <div><strong>District:</strong> ${spot.district} • <strong>Category:</strong> ${spot.category}</div>
            <div style="margin-top: 4px;"><strong>Priority Score:</strong> <span style="color: #b91c1c; font-weight: bold;">${spot.priority_score}/100</span></div>
            <div><strong>Unique Citizen Requests:</strong> ${spot.unique_request_count}</div>
            ${spot.digital_access_correction > 0 ? `<div style="margin-top: 4px; background: #ecfdf5; color: #047857; padding: 2px 4px; border-radius: 4px; font-size: 11px;">+${spot.digital_access_correction} Digital Divide Correction</div>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        onSelectHotspot(spot);
        infoWindow.open(mapInstanceRef.current, marker);
      });

      if (isSelected) {
        infoWindow.open(mapInstanceRef.current, marker);
      }

      markersRef.current.push(marker);
    });
    } catch (err) {
      console.warn("Failed to render Google Maps markers:", err);
      setMapError(true);
    }
  }, [mapLoaded, mapError, hotspots, selectedHotspot, onSelectHotspot]);

  // Seamless Google Maps display without requesting API keys or on API load issues
  if (!effectiveKey || mapError) {
    const centerSpot = selectedHotspot || (hotspots.length > 0 ? hotspots[0] : null);
    const lat = centerSpot ? centerSpot.latitude : 19.25;
    const lng = centerSpot ? centerSpot.longitude : 75.0;

    return (
      <div className="w-full h-full min-h-[380px] bg-slate-950 relative overflow-hidden flex flex-col">
        {/* Full-width interactive Google Maps embed with satellite/terrain */}
        <iframe
          title="Google Maps Maharashtra Hotspots"
          width="100%"
          height="100%"
          className="w-full h-full min-h-[380px] border-0"
          loading="lazy"
          src={`https://maps.google.com/maps?q=${lat},${lng}&t=k&z=8&ie=UTF8&iwloc=&output=embed`}
        />

        {/* Floating Hotspot Overlay Badges for Seamless Interaction */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 max-w-lg">
          {hotspots.map((spot) => {
            const isSelected = selectedHotspot?.id === spot.id;
            return (
              <button
                key={spot.id}
                onClick={() => onSelectHotspot(spot)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition shadow-md ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300'
                    : 'bg-slate-900/85 text-white border border-slate-700 hover:bg-slate-800'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : spot.priority_score >= 80 ? 'text-red-400' : 'text-amber-400'}`} />
                <span>{spot.district}: {spot.category}</span>
                <span className="font-extrabold text-[10px] bg-black/30 px-1.5 py-0.5 rounded">
                  {spot.priority_score}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return <div ref={mapContainerRef} className="w-full h-full min-h-[380px]" />;
}
