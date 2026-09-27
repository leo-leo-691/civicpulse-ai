/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        command: {
          base: '#060913',
          dark: '#0a0e1a',
          surface: '#111827',
          panel: 'rgba(17, 24, 39, 0.82)',
          border: 'rgba(51, 65, 85, 0.6)',
          cyan: '#00e5ff',
          blue: '#0284c7',
          accent: '#38bdf8',
          textMuted: '#94a3b8',
          textPrimary: '#f8fafc',
        },
        brics: {
          blue: '#0284c7',
          navy: '#060913',
          gold: '#d97706',
          green: '#10b981',
          emerald: '#059669',
          lightBg: '#0a0e1a'
        }
      }
    },
  },
  plugins: [],
}
