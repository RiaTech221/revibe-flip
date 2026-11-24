import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, Trash2, X, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { formatImageUrl } from '../../utils/imageUrl';
import {
  PROFILE_IMAGE_ACCEPT_ATTR,
  formatFileSize,
  validateProfileImageFile,
} from '../../utils/profileImageValidation';

interface ProfileAvatarUploadProps {
  currentImageUrl?: string | null;
  previewUrl?: string | null;
  selectedFile?: File | null;
  fullName?: string;
  error?: string | null;
  uploading?: boolean;
  disabled?: boolean;
  isMarkedForRemoval?: boolean;
  onFileSelect: (file: File) => void;
  onClearSelectedFile: () => void;
  onRemoveCurrentPhoto?: () => void;
  onValidationError: (message: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * Composant réutilisable de sélection, validation (JPG/PNG/WEBP ≤ 5 Mo)
 * et prévisualisation immédiate d'une photo de profil.
 */
export const ProfileAvatarUpload: React.FC<ProfileAvatarUploadProps> = ({
  currentImageUrl,
  previewUrl,
  selectedFile,
  fullName,
  error,
  uploading = false,
  disabled = false,
  isMarkedForRemoval = false,
  onFileSelect,
  onClearSelectedFile,
  onRemoveCurrentPhoto,
  onValidationError,
  inputRef: externalInputRef,
}) => {
  const internalInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = externalInputRef ?? internalInputRef;
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formattedCurrent = !isMarkedForRemoval ? formatImageUrl(currentImageUrl) : null;
  const displayedSrc = previewUrl || formattedCurrent;

  useEffect(() => {
    setImgError(false);
  }, [displayedSrc]);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    fullName || 'User'
  )}&background=7c3aed&color=fff`;

  const processFile = (file: File | undefined | null) => {
    if (!file) return;
    const validation = validateProfileImageFile(file);
    if (!validation.valid) {
      onValidationError(validation.error || 'Fichier invalide.');
      return;
    }
    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset la valeur pour permettre la re-sélection d'un même fichier après erreur ou annulation
    e.target.value = '';
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  return (
    <div className="space-y-2.5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-purple-600 bg-purple-50/70'
            : error
            ? 'border-rose-300 bg-rose-50/40'
            : 'border-gray-200 bg-gray-50/70 hover:border-purple-300'
        }`}
      >
        {/* Aperçu circulaire cliquable */}
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="relative group shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Choisir une nouvelle photo de profil"
        >
          <img
            src={!imgError && displayedSrc ? displayedSrc : fallbackAvatar}
            alt={fullName || 'Photo de profil'}
            onError={() => setImgError(true)}
            className="w-20 h-20 rounded-full object-cover border-2 border-purple-200 shadow-xs bg-white"
          />
          <span
            className={`absolute inset-0 rounded-full flex items-center justify-center transition-opacity ${
              uploading
                ? 'bg-slate-900/55 opacity-100'
                : 'bg-slate-900/45 opacity-0 group-hover:opacity-100'
            }`}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center border-2 border-white shadow-xs">
            <Camera className="w-3.5 h-3.5" />
          </span>
        </button>

        {/* Informations et boutons */}
        <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
          <div>
            <p className="text-xs font-black text-gray-900">Photo de profil</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Formats acceptés : <strong>JPG, PNG, WEBP</strong> • Taille maximale : <strong>5 Mo</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={PROFILE_IMAGE_ACCEPT_ATTR}
              onChange={handleInputChange}
              disabled={disabled || uploading}
              className="hidden"
              data-testid="profile-photo-input"
            />
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{displayedSrc ? 'Changer la photo' : 'Choisir une photo'}</span>
            </button>

            {selectedFile && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={onClearSelectedFile}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                <span>Annuler</span>
              </button>
            )}

            {!selectedFile && formattedCurrent && onRemoveCurrentPhoto && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={onRemoveCurrentPhoto}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-700 border border-gray-200 hover:border-rose-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            )}
          </div>

          {selectedFile && (
            <p className="text-[11px] font-semibold text-purple-700 flex items-center justify-center sm:justify-start gap-1.5 truncate">
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Nouvelle photo prête : {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </span>
            </p>
          )}

          {isMarkedForRemoval && !selectedFile && (
            <p className="text-[11px] font-semibold text-amber-700">
              La photo actuelle sera supprimée lors de l'enregistrement.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
