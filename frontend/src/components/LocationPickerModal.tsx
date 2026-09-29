'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation as NavIcon, X, Check, Loader2, Sparkles, Search, AlertTriangle } from 'lucide-react';
import { Translations } from '@/lib/translations';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: {
    latitude: number;
    longitude: number;
    suggestedDistrict?: string;
    suggestedLocality?: string;
  }) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  currentDistrict?: string;
  t: Translations;
}

// Sleek Dark Theme for Google Maps matching CivicPulse AI Palette
const DARK_MAP_STYLES: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#0d1527' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7ea5c7' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e1a' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#253554' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#253554' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#00e5ff' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#1a2744' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#09101f' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#131e36' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6889aa' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2c4a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9cb5cf' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#0e7490' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#155e75' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#18243e' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#7ea5c7' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040814' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#38bdf8' }] },
];

export default function LocationPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  currentDistrict,
  t,
}: LocationPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  // Default coordinate (Pune / Maharashtra coordinates)
  const defaultLat = initialLat || 18.5204;
  const defaultLng = initialLng || 73.8567;

  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string>('');
  const [resolvedAddress, setResolvedAddress] = useState<{
    district?: string;
    locality?: string;
    display?: string;
  } | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Reverse Geocoding with Google Maps Geocoder (with Nominatim fallback if offline)
  const reverseGeocode = (lat: number, lng: number) => {
    setIsResolving(true);

    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        setIsResolving(false);
        if (status === 'OK' && results && results[0]) {
          const components = results[0].address_components || [];
          let district = '';
          let locality = '';

          for (const c of components) {
            if (c.types.includes('administrative_area_level_2')) {
              district = c.long_name.replace(/District/gi, '').trim();
            }
            if (
              c.types.includes('sublocality') ||
              c.types.includes('sublocality_level_1') ||
              c.types.includes('locality') ||
              c.types.includes('neighborhood')
            ) {
              if (!locality) locality = c.long_name.trim();
            }
          }

          setResolvedAddress({
            district,
            locality,
            display: results[0].formatted_address,
          });
          return;
        }
      });
    } else {
      // Fallback geocoder query
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.address) {
            const district =
              data.address.state_district || data.address.county || data.address.city || data.address.district || '';
            const locality =
              data.address.village || data.address.suburb || data.address.town || data.address.neighbourhood || '';
            setResolvedAddress({
              district: district.replace(/District/gi, '').trim(),
              locality: locality.trim(),
              display: data.display_name,
            });
          }
        })
        .catch(() => {})
        .finally(() => setIsResolving(false));
    }
  };

  // Dynamically load Google Maps JavaScript API SDK
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    const initMap = () => {
      if (!isMounted || !mapContainerRef.current) return;
      const google = (window as any).google;
      if (!google || !google.maps) {
        setLoadError('Google Maps API failed to initialize.');
        return;
      }

      const startLat = initialLat || 18.5204;
      const startLng = initialLng || 73.8567;
      const center = { lat: startLat, lng: startLng };

      // Initialize Google Map
      const map = new google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 13,
        styles: DARK_MAP_STYLES,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });

      // Custom Pin Marker
      const pinIcon = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: '#00e5ff',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.8,
        anchor: new google.maps.Point(12, 22),
      };

      const marker = new google.maps.Marker({
        position: center,
        map,
        draggable: true,
        icon: pinIcon,
        animation: google.maps.Animation.DROP,
        title: 'Infrastructure Issue Location',
      });

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) {
          const newLat = parseFloat(pos.lat().toFixed(5));
          const newLng = parseFloat(pos.lng().toFixed(5));
          setSelectedPos({ lat: newLat, lng: newLng });
          reverseGeocode(newLat, newLng);
        }
      });

      map.addListener('click', (e: any) => {
        if (e.latLng) {
          const newLat = parseFloat(e.latLng.lat().toFixed(5));
          const newLng = parseFloat(e.latLng.lng().toFixed(5));
          marker.setPosition({ lat: newLat, lng: newLng });
          setSelectedPos({ lat: newLat, lng: newLng });
          reverseGeocode(newLat, newLng);
        }
      });

      // Google Places Autocomplete Search Box
      if (searchInputRef.current && google.maps.places) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ['geometry', 'name', 'formatted_address', 'address_components'],
        });

        autocomplete.bindTo('bounds', map);

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const newLat = parseFloat(place.geometry.location.lat().toFixed(5));
            const newLng = parseFloat(place.geometry.location.lng().toFixed(5));
            map.setCenter({ lat: newLat, lng: newLng });
            map.setZoom(15);
            marker.setPosition({ lat: newLat, lng: newLng });
            setSelectedPos({ lat: newLat, lng: newLng });
            reverseGeocode(newLat, newLng);
          }
        });

        autocompleteRef.current = autocomplete;
      }

      mapRef.current = map;
      markerRef.current = marker;
      setMapLoaded(true);
      reverseGeocode(startLat, startLng);
    };

    // Check if Google Maps script is already on page
    if ((window as any).google && (window as any).google.maps) {
      initMap();
    } else {
      const scriptId = 'google-maps-script-tag';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        const keyParam = apiKey ? `key=${apiKey}&` : '';
        script.src = `https://maps.googleapis.com/maps/api/js?${keyParam}libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) initMap();
        };
        script.onerror = () => {
          if (isMounted) setLoadError('Unable to load Google Maps SDK. Please check internet connection or API key.');
        };
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', initMap);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(5));
        const lng = parseFloat(position.coords.longitude.toFixed(5));
        setSelectedPos({ lat, lng });

        if (mapRef.current && markerRef.current) {
          mapRef.current.setCenter({ lat, lng });
          mapRef.current.setZoom(15);
          markerRef.current.setPosition({ lat, lng });
        }

        reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setGeoError('Could not retrieve current location. Please verify browser location permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: selectedPos.lat,
      longitude: selectedPos.lng,
      suggestedDistrict: resolvedAddress?.district,
      suggestedLocality: resolvedAddress?.locality,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#0c1222] border border-slate-700/90 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30 text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">{t.mapModalTitle}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                  Google Maps Platform
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.mapInstructions}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.cancelMap}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search Place + GPS + Coordinates */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search village, city, landmark or road..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <NavIcon className="w-3.5 h-3.5 text-white" />
            )}
            {t.locateMe}
          </button>

          <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-sans">{t.selectedCoordinates}:</span>
            <span className="font-semibold">{selectedPos.lat.toFixed(5)}° N, {selectedPos.lng.toFixed(5)}° E</span>
          </div>
        </div>

        {geoError && (
          <div className="px-4 py-2 bg-red-950/40 border-b border-red-800/40 text-red-300 text-xs">
            {geoError}
          </div>
        )}

        {loadError && (
          <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Google Map Canvas */}
        <div className="relative flex-1 w-full min-h-[340px] sm:min-h-[420px] bg-slate-900">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
          {!mapLoaded && !loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10 gap-2">
              <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
              <span className="text-xs text-slate-400">Loading Google Maps Platform...</span>
            </div>
          )}
        </div>

        {/* Footer: Resolved Address & Confirmation */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-300 flex-1 min-w-0">
            {isResolving ? (
              <span className="text-slate-400 flex items-center gap-1.5 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Detecting locality with Google Geocoder...
              </span>
            ) : resolvedAddress?.display ? (
              <div className="truncate">
                <span className="text-cyan-400 font-semibold flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {resolvedAddress.locality ? `${resolvedAddress.locality}, ` : ''}{resolvedAddress.district || 'Detected Area'}
                </span>
                <p className="text-[11px] text-slate-400 truncate">{resolvedAddress.display}</p>
              </div>
            ) : (
              <span className="text-slate-400">Click anywhere on the map or drag the cyan marker to pin your exact location.</span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition"
            >
              {t.cancelMap}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              <Check className="w-4 h-4" />
              {t.confirmLocation}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
