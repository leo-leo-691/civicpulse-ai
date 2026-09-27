import React from 'react';
import CitizenPortal from '@/components/CitizenPortal';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Citizen Voice Portal — CivicPulse AI',
  description: 'Multilingual citizen request submission, real audio ingestion, photo evidence verification, and tracking.',
};

export default function CitizenPage() {
  return (
    <main className="flex-1 py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
      <CitizenPortal />
    </main>
  );
}
