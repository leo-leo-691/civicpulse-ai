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
        brics: {
          blue: '#1e3a8a',
          navy: '#0f172a',
          gold: '#d97706',
          green: '#15803d',
          emerald: '#059669',
          lightBg: '#f8fafc'
        }
      }
    },
  },
  plugins: [],
}
