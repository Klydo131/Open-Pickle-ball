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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(18px, -22px) scale(1.08)' },
          '66%': { transform: 'translate(-16px, 14px) scale(0.96)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%) skewX(-12deg)' },
          '60%, 100%': { transform: 'translateX(220%) skewX(-12deg)' },
        },
        flame: {
          '0%, 100%': { transform: 'scale(1) rotate(-2deg)', opacity: '0.9' },
          '50%': { transform: 'scale(1.18) rotate(2deg)', opacity: '1' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'ring-progress': {
          '0%': { strokeDashoffset: 'var(--from, 100)' },
          '100%': { strokeDashoffset: 'var(--to, 0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'drift-slow': 'drift 22s ease-in-out infinite',
        'drift-slower': 'drift 30s ease-in-out infinite',
        sheen: 'sheen 3.5s ease-in-out infinite',
        flame: 'flame 1.1s ease-in-out infinite',
        pop: 'pop-in 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
