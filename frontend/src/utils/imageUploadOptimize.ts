/**
 * Optimise et redimensionne une photo côté navigateur avant son envoi vers Cloudinary/Backend :
 * - Réduit les images > 1600 px de côté ou > 3 Mo
 * - Compresse progressivement en JPEG si le fichier dépasse 5 Mo
 */
export async function prepareImageForUpload(
  file: File,
  maxDimension = 1600,
  maxBytes = 5 * 1024 * 1024
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Si l'image est déjà légère (<= 1.5 Mo) et au format standard, on évite un ré-encodage inutile
  const standardTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
  if (standardTypes.has(file.type.toLowerCase()) && file.size <= 1.5 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const qualities = [0.85, 0.72, 0.58];
      for (const q of qualities) {
        const blob: Blob | null = await new Promise((res) =>
          canvas.toBlob((b) => res(b), 'image/jpeg', q)
        );
        if (blob && (blob.size <= maxBytes || q === qualities[qualities.length - 1])) {
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
          resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }));
          return;
        }
      }
      resolve(file);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
