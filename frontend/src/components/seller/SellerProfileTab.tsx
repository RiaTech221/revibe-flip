import React from 'react';

interface SellerProfileTabProps {
  profileForm: {
    firstName: string;
    lastName: string;
    city: string;
    phone: string;
    address: string;
  };
  setProfileForm: React.Dispatch<
    React.SetStateAction<{
      firstName: string;
      lastName: string;
      city: string;
      phone: string;
      address: string;
    }>
  >;
  onSubmit: (e: React.FormEvent) => void;
  updating: boolean;
}

export const SellerProfileTab: React.FC<SellerProfileTabProps> = ({
  profileForm,
  setProfileForm,
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
            disabled={updating}
            className="px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {updating ? 'Enregistrement...' : 'Mettre à jour ma boutique'}
          </button>
        </div>
      </form>
    </div>
  );
};
