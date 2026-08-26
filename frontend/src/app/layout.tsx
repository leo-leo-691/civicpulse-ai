import './globals.css';
import React from 'react';

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
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
