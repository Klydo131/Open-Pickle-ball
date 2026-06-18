import type { Config } from 'tailwindcss';

/**
 * Open Pickleball design system — tokens mirror src/lib/theme.ts so colours,
 * radii and spacing stay consistent between Tailwind classes and any inline
 * style usage. Visual direction: deep ocean blue base, pickle-yellow primary
 * action, controlled serve-red accents, electric-blue secondary highlights.
 */
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#061B3A', // bg.primary — app background, hero, nav base
          900: '#082A5E', // bg.surface — cards, modal headers
          800: '#0A336F',
          700: '#0B3D79',
        },
        electric: '#32A7FF', // accent.info
        pickle: '#FFD626',   // accent.primary
        serve: '#FF314F',    // accent.dangerSport
        muted: '#AFC0D8',    // text.muted
        glass: '#2E4A78',    // border.glass
      },
      fontFamily: {
        display: ['var(--font-barlow)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '10px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      boxShadow: {
        glow: '0 0 24px 0 rgba(255, 214, 38, 0.35)',
        card: '0 8px 30px -12px rgba(0, 0, 0, 0.6)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 49, 79, 0.5)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 49, 79, 0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
