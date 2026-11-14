const GRADIENT_PALETTE = [
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
];

/**
 * Formate une URL d'image :
 * - Injecte automatiquement `f_auto,q_auto` sur les URLs Cloudinary (`res.cloudinary.com`)
 * - Résout les chemins locaux `/api/uploads/...` ou `/uploads/...`
 */
export function formatImageUrl(url?: string | null): string | null {
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
    return `${trimmed.slice(0, idx + marker.length)}f_auto,q_auto/${afterMarker}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const apiBase = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || '/api';
  if (trimmed.startsWith('/api/')) {
    if (apiBase.startsWith('http')) {
      const origin = apiBase.replace(/\/api\/?$/, '');
      return `${origin}${trimmed}`;
    }
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    const normalized = `/api${trimmed}`;
    if (apiBase.startsWith('http')) {
      const origin = apiBase.replace(/\/api\/?$/, '');
      return `${origin}${normalized}`;
    }
    return normalized;
  }

  return trimmed;
}

/**
 * Retourne une initiale et un dégradé déterministe pour le fallback uniforme
 * (utilisé lorsque l'image est absente ou qu'une ancienne image `/uploads/` est indisponible).
 */
export function getInitialAndGradient(label?: string | null): { initial: string; gradientClass: string } {
  const clean = (label || 'R').trim();
  const initial = clean.charAt(0).toUpperCase() || 'R';
  let hash = 0;
  for (let i = 0; i < clean.length; i += 1) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  const gradientClass = GRADIENT_PALETTE[hash % GRADIENT_PALETTE.length];
  return { initial, gradientClass };
}
