import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Light theme (owner feedback 19 Nov 2026, masterprompt.md §15.6): matches bgap-academy's
      // own palette (frontend/app/globals.css — #F8F6F1 background, #0f172a text, #1D4ED8 brand
      // blue). The *keys* (dark/surface/card/...) are kept as-is rather than renamed, since ~40
      // files reference them by name — only the values changed, so every bg-bgap-*/text-bgap-*
      // class across the HUD repaints without touching each component individually. "dark" no
      // longer means a dark colour; it's just the token that was always used for "the main
      // background surface". Not yet live-verified (the Browser pane stayed backgrounded all
      // session) — see masterprompt.md §15.6 for the couple of raw text-white/bg-black spots that
      // needed fixing alongside this, and what still needs an actual look.
      colors: {
        bgap: {
          dark: '#F8F6F1',
          surface: '#FFFFFF',
          card: '#F1F5F9',
          border: '#CBD5E1',
          cyan: '#1D4ED8',
          emerald: '#10B981',
          gold: '#F59E0B',
          neon: '#38BDF8',
          ruby: '#DC2626',
          text: '#0F172A',
          muted: '#475569',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'], // BGAP's own brand font (bgap-academy globals.css)
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        // A bright glow reads well against a near-black backdrop; against a light one it needs to
        // be a soft tinted shadow instead, or it's nearly invisible. Lower opacity to match.
        'neon-cyan': '0 4px 20px -2px rgba(29, 78, 216, 0.3)',
        'neon-emerald': '0 4px 20px -2px rgba(16, 185, 129, 0.3)',
        'hud-glass': '0 8px 32px 0 rgba(15, 23, 42, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
