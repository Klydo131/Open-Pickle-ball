/**
 * Input validation & sanitisation (defence-in-depth).
 *
 * Even though React escapes output by default, we validate and normalise all
 * user-supplied text at the boundary so bad data never enters the store. When
 * the backend is added, these same schemas are reused server-side (see
 * SECURITY.md → "validate on every trust boundary").
 */
import { z } from 'zod';
import { PLAYER_THEMES } from './playerThemes';

const themeIds = PLAYER_THEMES.map((t) => t.id) as [string, ...string[]];

// Matches ASCII control characters (0x00–0x1F and 0x7F).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;

/** Strip control characters and collapse whitespace from free text. */
export function sanitizeText(input: string): string {
  return input.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim();
}

export const playerNameSchema = z
  .string()
  .transform(sanitizeText)
  .pipe(
    z
      .string()
      .min(1, 'Enter a name')
      .max(24, 'Keep it under 24 characters'),
  );

export const themeIdSchema = z.enum(themeIds);

export const courtNameSchema = z
  .string()
  .transform(sanitizeText)
  .pipe(z.string().min(1, 'Enter a court name').max(24, 'Too long'));

export type PlayerNameInput = z.input<typeof playerNameSchema>;
