/**
 * Validation côté client des photos de profil (US-04).
 * Règles alignées avec le backend : formats JPG, PNG, WEBP uniquement, taille ≤ 5 Mo.
 */

export const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

export const ALLOWED_PROFILE_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export const ALLOWED_PROFILE_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const PROFILE_IMAGE_ACCEPT_ATTR = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

export interface ProfileImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateProfileImageFile(file: File | null | undefined): ProfileImageValidationResult {
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: 'Le fichier sélectionné est vide.',
    };
  }

  const lowerName = (file.name || '').toLowerCase();
  const hasAllowedExtension = ALLOWED_PROFILE_IMAGE_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );
  const mime = (file.type || '').trim().toLowerCase();
  const hasAllowedMime = mime === '' ? hasAllowedExtension : ALLOWED_PROFILE_IMAGE_MIME_TYPES.has(mime);

  if (!hasAllowedExtension || !hasAllowedMime) {
    return {
      valid: false,
      error: 'Format de fichier non autorisé. Formats acceptés : JPG, PNG, WEBP.',
    };
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'La taille du fichier dépasse la limite autorisée de 5 Mo.',
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2).replace('.', ',')} Mo`;
}
