/**
 * Onglet / Vue Vendeur : SellerProfileTab
 * 
 * Module interactif pour la gestion des annonces, commandes, finances ou profil vendeur (SellerProfileTab).
 */

import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { ProfileAvatarUpload } from '../common/ProfileAvatarUpload';

interface SellerProfileTabProps {
  profileForm: {
    firstName: string;
    lastName: string;
    city: string;
    phone: string;
    address: string;
    profilePicture: string;
  };
  setProfileForm: React.Dispatch<
    React.SetStateAction<{
      firstName: string;
      lastName: string;
      city: string;
      phone: string;
      address: string;
      profilePicture: string;
    }>
  >;
  selectedPhotoFile: File | null;
  photoPreviewUrl: string | null;
  photoMarkedForRemoval: boolean;
  photoError: string | null;
  uploadingPhoto: boolean;
  profileSuccess: string | null;
  profileError: string | null;
  onSelectPhotoFile: (file: File) => void;
  onClearSelectedPhoto: () => void;
  onRemoveCurrentPhoto: () => void;
  onPhotoValidationError: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  updating: boolean;
}

export const SellerProfileTab: React.FC<SellerProfileTabProps> = ({
  profileForm,
  setProfileForm,
  selectedPhotoFile,
  photoPreviewUrl,
  photoMarkedForRemoval,
  photoError,
  uploadingPhoto,
  profileSuccess,
  profileError,
  onSelectPhotoFile,
  onClearSelectedPhoto,
  onRemoveCurrentPhoto,
  onPhotoValidationError,
  onSubmit,
  updating,
}) => {
  return (
    <div className="max-w-2xl space-y-6 text-xs">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Profil de la Boutique</h1>
        <p className="text-xs text-gray-400 mt-0.5">Informations du vendeur certifié sur ReVibe FliP</p>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-4">
        {profileSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div
            role="alert"
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <ProfileAvatarUpload
          currentImageUrl={profileForm.profilePicture}
          previewUrl={photoPreviewUrl}
          selectedFile={selectedPhotoFile}
          fullName={`${profileForm.firstName} ${profileForm.lastName}`.trim() || 'Boutique'}
          error={photoError}
          uploading={uploadingPhoto}
          disabled={updating}
          isMarkedForRemoval={photoMarkedForRemoval}
          onFileSelect={onSelectPhotoFile}
          onClearSelectedFile={onClearSelectedPhoto}
          onRemoveCurrentPhoto={onRemoveCurrentPhoto}
          onValidationError={onPhotoValidationError}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Prénom *</label>
            <input
              type="text"
              required
              value={profileForm.firstName}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Nom de famille *</label>
            <input
              type="text"
              required
              value={profileForm.lastName}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Ville principale *</label>
            <input
              type="text"
              required
              value={profileForm.city}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="Dakar, Thiès..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Téléphone de contact *</label>
            <input
              type="tel"
              required
              value={profileForm.phone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+221 77 000 00 00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Adresse / Quartier de retrait</label>
          <input
            type="text"
            value={profileForm.address}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Ex: Liberté 6, Almadies, Mermoz..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={updating || uploadingPhoto}
            className="px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {uploadingPhoto
              ? 'Téléversement de la photo...'
              : updating
              ? 'Enregistrement...'
              : 'Mettre à jour ma boutique'}
          </button>
        </div>
      </form>
    </div>
  );
};
