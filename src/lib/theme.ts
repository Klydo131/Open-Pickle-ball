/**
 * Design tokens (single source of truth, mirrored in tailwind.config.ts).
 * Pulled directly from the Open Pickleball art-direction brief.
 */
export const colors = {
  ocean950: '#061B3A',
  ocean900: '#082A5E',
  ocean800: '#0A336F',
  ocean700: '#0B3D79',
  electricBlue: '#32A7FF',
  pickleYellow: '#FFD626',
  serveRed: '#FF314F',
  textOnDark: '#FFFFFF',
  textMuted: '#AFC0D8',
  glassBorder: '#2E4A78',
} as const;

export const radius = { sm: 10, md: 16, lg: 24, xl: 32 } as const;

export const spacing = { pageX: 24, card: 16, sectionY: 22 } as const;
