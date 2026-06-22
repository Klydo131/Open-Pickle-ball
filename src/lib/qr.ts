'use client';

/**
 * QR rendering for profile sharing. Thin wrapper over the `qrcode` library,
 * which draws entirely in-browser (canvas) — no network, no external service.
 * The QR encodes the same `OPB1.…` string used for copy-paste sharing.
 */

import QRCode from 'qrcode';

/**
 * Render `text` to a PNG data URL. Dark navy modules on white keep it on-brand
 * while staying high-contrast enough for any camera to read.
 * Resolves to null if the text is too large to fit a QR symbol.
 */
export async function qrPngDataUrl(text: string, size = 256): Promise<string | null> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
      color: { dark: '#06182Fff', light: '#FFFFFFff' },
    });
  } catch {
    // Thrown when the payload exceeds the largest QR version (e.g. a photo).
    return null;
  }
}
