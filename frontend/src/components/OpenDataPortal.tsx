'use client';

import React, { useState } from 'react';
import { Download, FileCode, ShieldCheck, Database } from 'lucide-react';
import { getOpenDataExport } from '@/lib/api';

export default function OpenDataPortal() {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (format: string) => {
    setDownloading(true);
    try {
      const data = await getOpenDataExport();
      
      let fileString = "";
      let mimeType = "application/json";

      if (format === "csv") {
        mimeType = "text/csv";
        if (data.length > 0) {
          const keys = Object.keys(data[0]);
          const csvContent = [
            keys.join(","),
            ...data.map((row: any) => keys.map(k => JSON.stringify(row[k])).join(","))
          ].join("\\n");
          fileString = `data:${mimeType};charset=utf-8,${encodeURIComponent(csvContent)}`;
        } else {
          fileString = `data:${mimeType};charset=utf-8,`;
        }
      } else {
        fileString = `data:${mimeType};charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      }

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', fileString);
      downloadAnchor.setAttribute('download', `civicpulse_open_data_export.${format}`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Failed to download Open Data Export.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-[#0c1222]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md">
      <div className="border-b border-slate-800/80 pb-3 flex flex-wrap gap-2 justify-between items-center">
        <div>
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" /> Digital Public Good (DPGA Indicator #6)
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">Open Data Export Portal</h2>
        </div>
        <span className="px-2.5 py-0.5 bg-slate-800/80 text-cyan-300 text-xs font-mono rounded-full border border-slate-700/80">
          Apache 2.0 Licensed
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        In compliance with the 9 Digital Public Goods Alliance indicators, CivicPulse AI provides anonymized, aggregated cluster &amp; infrastructure gap dataset exports for public policy researchers, civil society, and international developers.
      </p>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => handleExport('json')}
          disabled={downloading}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-[0_0_15px_rgba(0,229,255,0.25)] disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> {downloading ? 'Preparing Export...' : 'Download GeoJSON / JSON Export'}
        </button>
        <button
          onClick={() => handleExport('csv')}
          disabled={downloading}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-50"
        >
          <FileCode className="w-4 h-4 text-slate-400" /> Download Anonymized CSV Dataset
        </button>
      </div>
    </div>
  );
}
