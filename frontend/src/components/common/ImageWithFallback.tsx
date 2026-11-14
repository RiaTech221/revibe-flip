import React, { useEffect, useState } from 'react';
import { formatImageUrl, getInitialAndGradient } from '../../utils/imageUrl';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  fallbackLabel?: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Affiche une image optimisée (Cloudinary `f_auto,q_auto`) avec fallback uniforme
 * (initiale sur dégradé) si l'URL est absente ou échoue au chargement (anciennes images `/uploads/`).
 */
export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackLabel,
  className = 'w-full h-full object-cover',
  fallbackClassName = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const formattedUrl = formatImageUrl(src);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!formattedUrl || hasError) {
    const { initial, gradientClass } = getInitialAndGradient(fallbackLabel || alt);
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br ${gradientClass} text-white font-semibold select-none ${className} ${fallbackClassName}`}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={formattedUrl}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};
