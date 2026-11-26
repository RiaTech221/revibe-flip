/**
 * Onglet / Vue Vendeur : SellerProductModal
 * 
 * Modale de création et modification d'annonce avec import direct de photos
 * (glisser-déposer ou sélection de fichiers), grand aperçu dynamique (la dernière photo
 * ajoutée prend automatiquement la place dans l'aperçu) et envoi vers /api/uploads (Cloudinary).
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Package, ImagePlus, ImageOff, Loader2, Star, AlertCircle, Plus } from 'lucide-react';
import { Category, ProductCondition } from '../../types';
import { uploadApi } from '../../services/api';
import { prepareImageForUpload } from '../../utils/imageUploadOptimize';
import { formatImageUrl } from '../../utils/imageUrl';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

interface SellerProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  categories: Category[];
  productForm: {
    title: string;
    categoryId: number;
    price: string;
    condition: string;
    description: string;
    brand: string;
    size: string;
    color: string;
    locationCity: string;
    locationAddress?: string;
    images: string[];
    status?: string;
  };
  setProductForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  formatPrice: (amount: number) => string;
  submitting?: boolean;
  submitError?: string | null;
}

export const SellerProductModal: React.FC<SellerProductModalProps> = ({
  isOpen,
  onClose,
  isEditing,
  categories,
  productForm,
  setProductForm,
  onSubmit,
  formatPrice,
  submitting = false,
  submitError = null,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

  const validImages = (productForm.images || []).filter((img) => img && img.trim().length > 0);

  // Réinitialiser l'état visuel à l'ouverture / fermeture de la modale
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      setUploadError(null);
      setBrokenUrls({});
    } else {
      Object.values(localPreviews).forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
      setLocalPreviews({});
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
        setPendingPreviewUrl(null);
      }
    }
  }, [isOpen]);

  // Maintenir activeIndex dans les bornes si une image est supprimée
  useEffect(() => {
    if (validImages.length === 0) {
      setActiveIndex(0);
    } else if (activeIndex >= validImages.length) {
      setActiveIndex(validImages.length - 1);
    }
  }, [validImages.length, activeIndex]);

  if (!isOpen) return null;

  const remainingSlots = Math.max(0, MAX_PHOTOS - validImages.length);
  const currentImageUrl = validImages[activeIndex] || null;
  const resolvedPreviewSrc = pendingPreviewUrl
    ? pendingPreviewUrl
    : currentImageUrl
      ? localPreviews[currentImageUrl] || formatImageUrl(currentImageUrl) || currentImageUrl
      : null;

  const enteredPrice = Number(productForm.price) || 0;
  const estimatedCommission = Math.round(enteredPrice * 0.20);
  const estimatedNetEarnings = Math.max(0, enteredPrice - estimatedCommission);

  const conditionOptions: { value: ProductCondition; label: string }[] = [
    { value: 'NEW_WITH_TAG', label: 'Neuf avec étiquette' },
    { value: 'VERY_GOOD', label: 'Très bon état' },
    { value: 'GOOD', label: 'Bon état' },
    { value: 'SATISFACTORY', label: 'État satisfaisant' },
  ];

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);

    if (remainingSlots <= 0) {
      setUploadError(`Vous pouvez ajouter au maximum ${MAX_PHOTOS} photos par annonce.`);
      return;
    }

    const files = Array.from(fileList).slice(0, remainingSlots);
    const uploadedEntries: { url: string; blobUrl: string }[] = [];

    setUploading(true);
    try {
      for (const file of files) {
        if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
          setUploadError('Format non supporté. Utilisez JPG, PNG ou WEBP.');
          continue;
        }
        const optimized = await prepareImageForUpload(file);
        if (optimized.size > MAX_FILE_SIZE_BYTES) {
          setUploadError('La photo dépasse la taille maximale autorisée de 5 Mo.');
          continue;
        }

        // Aperçu instantané dans la zone principale pendant le téléversement
        const blobUrl = URL.createObjectURL(optimized);
        setPendingPreviewUrl(blobUrl);

        const res = await uploadApi.uploadFile(optimized, 'products');
        const url = res.data?.data;
        if (url) {
          uploadedEntries.push({ url, blobUrl });
        } else {
          URL.revokeObjectURL(blobUrl);
        }
      }

      if (uploadedEntries.length > 0) {
        setLocalPreviews((prev) => {
          const next = { ...prev };
          uploadedEntries.forEach(({ url, blobUrl }) => {
            next[url] = blobUrl;
          });
          return next;
        });

        const nextTotal = Math.min(MAX_PHOTOS, validImages.length + uploadedEntries.length);
        setProductForm((prev: any) => {
          const current = (prev.images || []).filter((img: string) => img && img.trim().length > 0);
          return {
            ...prev,
            images: [...current, ...uploadedEntries.map((e) => e.url)].slice(0, MAX_PHOTOS),
          };
        });
        // La nouvelle photo prend immédiatement la place dans l'aperçu principal
        setActiveIndex(nextTotal - 1);
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || "Impossible de téléverser la photo. Veuillez réessayer.");
    } finally {
      setPendingPreviewUrl(null);
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadError(null);
    const targetUrl = validImages[index];
    if (targetUrl && localPreviews[targetUrl]) {
      URL.revokeObjectURL(localPreviews[targetUrl]);
      setLocalPreviews((prev) => {
        const next = { ...prev };
        delete next[targetUrl];
        return next;
      });
    }
    setProductForm((prev: any) => {
      const current = (prev.images || []).filter((img: string) => img && img.trim().length > 0);
      return {
        ...prev,
        images: current.filter((_: string, idx: number) => idx !== index),
      };
    });
    if (activeIndex >= index && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setProductForm((prev: any) => {
      const current = (prev.images || []).filter((img: string) => img && img.trim().length > 0);
      const selected = current[index];
      if (!selected) return prev;
      const next = [selected, ...current.filter((_: string, idx: number) => idx !== index)];
      return { ...prev, images: next };
    });
    setActiveIndex(0);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!uploading) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const openFilePicker = () => {
    if (!uploading && !submitting && remainingSlots > 0) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-150 max-h-[90vh] overflow-y-auto text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-150">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-gray-900">
              {isEditing ? 'Modifier l’annonce' : 'Publier un nouvel article'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading || submitting}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-700 mb-1">Titre de l'annonce *</label>
            <input
              type="text"
              required
              placeholder="Ex: Grand Boubou Bazin Getzner Riche..."
              value={productForm.title}
              onChange={(e) => setProductForm((prev: any) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Rayon / Catégorie *</label>
              <select
                value={productForm.categoryId}
                onChange={(e) => setProductForm((prev: any) => ({ ...prev, categoryId: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-xs focus:ring-2 focus:ring-purple-600 cursor-pointer"
              >
                <option value={0}>Sélectionner un rayon</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Prix de vente (FCFA) *</label>
              <input
                type="number"
                min="500"
                required
                placeholder="Ex: 25000"
                value={productForm.price}
                onChange={(e) => setProductForm((prev: any) => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-black text-purple-700 text-xs focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* Décomposition financière prévisionnelle */}
          {enteredPrice > 0 && (
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Commission plateforme ReVibe (20%) :</span>
                <span className="font-bold text-gray-900">- {formatPrice(estimatedCommission)}</span>
              </div>
              <div className="flex justify-between font-black text-xs text-purple-950 pt-1 border-t border-purple-200">
                <span>Votre rémunération nette (Payout) :</span>
                <span className="text-purple-700 font-black">{formatPrice(estimatedNetEarnings)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">État de l'article *</label>
              <select
                value={productForm.condition}
                onChange={(e) => setProductForm((prev: any) => ({ ...prev, condition: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-xs cursor-pointer"
              >
                {conditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Taille</label>
              <input
                type="text"
                placeholder="M, L, 42, Unique..."
                value={productForm.size}
                onChange={(e) => setProductForm((prev: any) => ({ ...prev, size: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Marque / Atelier</label>
              <input
                type="text"
                placeholder="Ex: Woodin, Getzner, Nike..."
                value={productForm.brand}
                onChange={(e) => setProductForm((prev: any) => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                placeholder="Dakar, Thiès..."
                value={productForm.locationCity}
                onChange={(e) => setProductForm((prev: any) => ({ ...prev, locationCity: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description détaillée</label>
            <textarea
              rows={3}
              placeholder="Détails du tissu, coupe, conseils d'entretien..."
              value={productForm.description}
              onChange={(e) => setProductForm((prev: any) => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Zone photo unifiée : grand aperçu de la photo active + galerie compacte */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-gray-700">
                Photos de l'article ({validImages.length}/{MAX_PHOTOS})
              </label>
              {validImages.length > 0 && remainingSlots > 0 && (
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={uploading || submitting}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFilesSelected(e.target.files)}
              disabled={uploading || submitting}
              className="hidden"
            />

            {/* Cadre principal : affiche la photo active en grand, ou la zone de dépôt si vide */}
            {resolvedPreviewSrc ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative h-48 w-full rounded-2xl overflow-hidden border-2 transition-colors bg-gray-100 ${
                  isDragging ? 'border-purple-600' : 'border-dashed border-purple-200'
                }`}
              >
                {currentImageUrl && brokenUrls[currentImageUrl] && !pendingPreviewUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1.5 px-4 text-center">
                    <ImageOff className="w-7 h-7 text-gray-300" />
                    <span className="text-xs font-bold text-gray-500">Aperçu indisponible pour cette ancienne photo</span>
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="mt-1 px-3 py-1.5 rounded-xl bg-purple-700 text-white text-[11px] font-bold hover:bg-purple-800 cursor-pointer"
                    >
                      Importer une nouvelle photo
                    </button>
                  </div>
                ) : (
                  <img
                    src={resolvedPreviewSrc}
                    alt={`Aperçu photo ${activeIndex + 1}`}
                    onError={() => {
                      if (currentImageUrl) {
                        setBrokenUrls((prev) => ({ ...prev, [currentImageUrl]: true }));
                      }
                    }}
                    className="w-full h-full object-contain bg-gray-50"
                  />
                )}

                {uploading && (
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center text-white gap-1.5">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-bold">Téléversement vers Cloudinary…</span>
                  </div>
                )}

                {!uploading && currentImageUrl && (
                  <>
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {activeIndex === 0 ? (
                        <span className="bg-purple-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                          Principale
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(activeIndex)}
                          className="inline-flex items-center gap-1 bg-black/65 hover:bg-purple-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          <Star className="w-3 h-3" />
                          <span>Définir comme principale</span>
                        </button>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      {remainingSlots > 0 && (
                        <button
                          type="button"
                          onClick={openFilePicker}
                          className="inline-flex items-center gap-1 bg-white/95 hover:bg-white text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs cursor-pointer"
                        >
                          <ImagePlus className="w-3 h-3 text-purple-700" />
                          <span>Ajouter</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(activeIndex)}
                        aria-label="Retirer cette photo"
                        className="p-1.5 bg-black/65 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={openFilePicker}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openFilePicker();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-400 bg-gray-50/70 hover:bg-purple-50/40'
                } ${uploading ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ImagePlus className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-extrabold text-gray-800">
                  {uploading ? 'Téléversement en cours…' : 'Cliquez pour sélectionner une photo'}
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5">
                  JPG, PNG ou WEBP (max. 5 Mo)
                </span>
              </div>
            )}

            {/* Bandeau de miniatures si au moins 1 photo : cliquer affiche dans le grand aperçu */}
            {validImages.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                {validImages.map((url, idx) => {
                  const thumbSrc = localPreviews[url] || formatImageUrl(url) || url;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={`${url}-${idx}`}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-gray-100 ${
                        isActive
                          ? 'border-purple-700 ring-2 ring-purple-700/20'
                          : 'border-gray-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {brokenUrls[url] ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageOff className="w-4 h-4" />
                        </div>
                      ) : (
                        <img
                          src={thumbSrc}
                          alt={`Miniature ${idx + 1}`}
                          onError={() => setBrokenUrls((prev) => ({ ...prev, [url]: true }))}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-purple-700/90 text-white text-[8px] font-bold text-center leading-tight py-0.5">
                          1re
                        </span>
                      )}
                    </button>
                  );
                })}

                {remainingSlots > 0 && (
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={uploading || submitting}
                    title="Ajouter une autre photo"
                    className="w-12 h-12 rounded-xl shrink-0 border-2 border-dashed border-purple-300 hover:border-purple-600 bg-purple-50/50 hover:bg-purple-50 text-purple-700 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {uploadError && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{uploadError}</span>
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading || submitting}
              className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={uploading || submitting}
              className="flex-1 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20 cursor-pointer disabled:opacity-50"
            >
              {submitting
                ? 'Enregistrement…'
                : isEditing
                  ? 'Enregistrer'
                  : 'Publier l’annonce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
