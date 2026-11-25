export interface MobileImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'limit' | 'fit' | 'thumb';
  gravity?: 'auto' | 'face';
}

/**
 * Formate une URL d'image sur Mobile :
 * injecte automatiquement `f_auto,q_auto` (+ dimensions/recadrage optionnels) sur Cloudinary.
 */
export function formatImageUrl(
  url?: string | null,
  options?: MobileImageTransformOptions
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/image/upload/')) {
    const marker = '/image/upload/';
    const idx = trimmed.indexOf(marker);
    const afterMarker = trimmed.slice(idx + marker.length);
    if (afterMarker.includes('f_auto') || afterMarker.includes('q_auto')) {
      return trimmed;
    }
    const transforms = ['f_auto', 'q_auto'];
    if (options?.crop) transforms.push(`c_${options.crop}`);
    if (options?.gravity) transforms.push(`g_${options.gravity}`);
    if (options?.width) transforms.push(`w_${options.width}`);
    if (options?.height) transforms.push(`h_${options.height}`);
    return `${trimmed.slice(0, idx + marker.length)}${transforms.join(',')}/${afterMarker}`;
  }

  return trimmed;
}
