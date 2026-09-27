import React from 'react';
import { Metadata } from 'next';
import PolicymakerDashboard from '@/components/PolicymakerDashboard';

export const metadata: Metadata = {
  title: 'Policymaker Dashboard | CivicPulse AI',
  description: 'Evidence-based infrastructure allocation, multimodal damage scoring, and human-in-the-loop governance for district magistrates and policymakers.',
};

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PolicymakerDashboard />
    </div>
  );
}
