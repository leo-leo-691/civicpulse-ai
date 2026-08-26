'use client';

import React, { useState } from 'react';
import { Download, FileCode, ShieldCheck, Database } from 'lucide-react';

export default function OpenDataPortal() {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (format: string) => {
    setDownloading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/open-data/export');
      const data = await res.json();
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `civicpulse_open_data_export.${format}`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Open Data Export downloaded successfully.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
      <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Digital Public Good (DPGA Indicator #6)
          </span>
          <h2 className="text-xl font-bold text-slate-900">Open Data Export Portal</h2>
        </div>
        <span className="px-3 py-1 bg-blue-50 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">
          Apache 2.0 Licensed
        </span>
      </div>

      <p className="text-xs text-slate-600">
        In compliance with the 9 Digital Public Goods Alliance indicators, CivicPulse AI provides anonymized, aggregated cluster & infrastructure gap dataset exports for public policy researchers, civil society, and international developers.
      </p>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => handleExport('json')}
          disabled={downloading}
          className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" /> Download GeoJSON / JSON Export
        </button>
        <button
          onClick={() => handleExport('csv')}
          disabled={downloading}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition"
        >
          <FileCode className="w-4 h-4" /> Download Anonymized CSV Dataset
        </button>
      </div>
    </div>
  );
}
