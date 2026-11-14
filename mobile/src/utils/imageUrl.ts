const GRADIENT_PAIRS: [string, string][] = [
  ['#f59e0b', '#ea580c'],
  ['#10b981', '#0d9488'],
  ['#0ea5e9', '#4f46e5'],
  ['#f43f5e', '#db2777'],
  ['#8b5cf6', '#9333ea'],
  ['#14b8a6', '#0891b2'],
];

/**
 * Formate une URL d'image pour l'application mobile :
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

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('file://')) {
    return trimmed;
  }

  const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  if (trimmed.startsWith('/api/')) {
    return `${origin}${trimmed}`;
  }
  if (trimmed.startsWith('/uploads/')) {
    return `${origin}/api${trimmed}`;
  }

  return trimmed;
}

/**
 * Retourne une initiale et une couleur de dégradé déterministe pour le fallback uniforme
 * des images absentes ou anciennes (`/uploads/`).
 */
export function getInitialAndGradient(label?: string | null): { initial: string; colors: [string, string] } {
  const clean = (label || 'R').trim();
  const initial = clean.charAt(0).toUpperCase() || 'R';
  let hash = 0;
  for (let i = 0; i < clean.length; i += 1) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  const colors = GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];
  return { initial, colors };
}
