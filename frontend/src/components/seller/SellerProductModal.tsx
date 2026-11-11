import React from 'react';
import { X, Tag, Package, Sparkles } from 'lucide-react';
import { Category, ProductCondition } from '../../types';

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
}) => {
  if (!isOpen) return null;

  const enteredPrice = Number(productForm.price) || 0;
  const estimatedCommission = Math.round(enteredPrice * 0.20);
  const estimatedNetEarnings = Math.max(0, enteredPrice - estimatedCommission);

  const conditionOptions: { value: ProductCondition; label: string }[] = [
    { value: 'NEW_WITH_TAG', label: 'Neuf avec étiquette' },
    { value: 'VERY_GOOD', label: 'Très bon état' },
    { value: 'GOOD', label: 'Bon état' },
    { value: 'SATISFACTORY', label: 'État satisfaisant' },
  ];

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
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div>
            <label className="block font-bold text-gray-700 mb-1">URL de la photo principale</label>
            <input
              type="url"
              placeholder="https://..."
              value={productForm.images[0] || ''}
              onChange={(e) => {
                const val = e.target.value;
                setProductForm((prev: any) => ({
                  ...prev,
                  images: [val, ...(prev.images.slice(1) || [])],
                }));
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20 cursor-pointer"
            >
              {isEditing ? 'Sauvegarder' : 'Publier l’annonce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
