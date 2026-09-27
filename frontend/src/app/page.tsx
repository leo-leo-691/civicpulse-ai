'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ReducedMotionView from '@/components/three/ReducedMotionView';
import { AlertTriangle } from 'lucide-react';

const StoryScene = dynamic(() => import('@/components/three/StoryScene'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#060913] flex items-center justify-center text-cyan-400 font-mono text-xs">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span>Initializing CivicPulse 3D Engine...</span>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <main className="min-h-screen bg-[#060913] text-white flex flex-col relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Synthetic Data Notice Banner (DPGA Compliance) */}
      <div className="bg-amber-950/60 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs font-mono flex items-center justify-center gap-2 text-center z-40 backdrop-blur-md">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong>BRICS Demonstration Mode:</strong> Data presented is synthesized for testing and adheres to DPGA open-source guidelines.
        </span>
      </div>

      {/* Render 3D Scene or Accessible Static Fallback */}
      {!mounted ? (
        <div className="min-h-screen bg-[#060913] flex items-center justify-center text-cyan-400 font-mono text-xs">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prefersReducedMotion ? (
        <ReducedMotionView />
      ) : (
        <StoryScene />
      )}
    </main>
  );
}
