'use client';

/**
 * Client-side photo handling for player profiles.
 *
 * Everything here runs in the browser on a canvas — no upload, no server, no
 * network. A selfie picked from the camera/library is cropped to a centered
 * square, scaled down, and re-encoded as a compact JPEG data URL so it sits
 * comfortably in localStorage and (optionally) inside a share code. The original
 * file is never stored or transmitted.
 */

/** Edge length (px) of the square avatar we keep. Small on purpose. */
const AVATAR_SIZE = 256;
/** JPEG quality — visually clean for an avatar while staying tiny. */
const AVATAR_QUALITY = 0.82;

/**
 * Turn a user-picked image File into a square, compressed JPEG data URL.
 * Resolves to the data URL, or rejects if the file isn't a decodable image.
 */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }
  const bitmap = await loadImage(file);
  const size = AVATAR_SIZE;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process image');

  // Center-crop to a square (cover), then draw scaled into the canvas.
  const sourceW = 'width' in bitmap ? bitmap.width : (bitmap as HTMLImageElement).naturalWidth;
  const sourceH = 'height' in bitmap ? bitmap.height : (bitmap as HTMLImageElement).naturalHeight;
  const side = Math.min(sourceW, sourceH);
  const sx = (sourceW - side) / 2;
  const sy = (sourceH - side) / 2;

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap as CanvasImageSource, sx, sy, side, side, 0, 0, size, size);
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

  return canvas.toDataURL('image/jpeg', AVATAR_QUALITY);
}

/** Decode a File to something drawable, preferring the fast ImageBitmap path. */
async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to the <img> path (e.g. Safari quirks) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read that image'));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
