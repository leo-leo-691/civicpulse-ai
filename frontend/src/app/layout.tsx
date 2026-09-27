import './globals.css';
import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'CivicPulse AI — Digital Public Infrastructure Decision Platform',
  description: 'Multilingual AI Public Infrastructure Decision-Support Platform for BRICS Governance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#060913] text-[#f8fafc] flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navigation />
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}

