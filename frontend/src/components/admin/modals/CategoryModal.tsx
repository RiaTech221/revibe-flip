import React from 'react';
import { X } from 'lucide-react';
import { Category } from '../../../types';

interface CategoryModalProps {
  isOpen: boolean;
  editingCategory: Category | null;
  catName: string;
  setCatName: (name: string) => void;
  catSlug: string;
  setCatSlug: (slug: string) => void;
  catDesc: string;
  setCatDesc: (desc: string) => void;
  actionLoading: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  editingCategory,
  catName,
  setCatName,
  catSlug,
  setCatSlug,
  catDesc,
  setCatDesc,
  actionLoading,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-gray-150 pb-3">
          <h3 className="text-base font-black text-gray-900">
            {editingCategory ? 'Modifier le Rayon' : 'Ajouter un Nouveau Rayon'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Nom du rayon</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => {
                setCatName(e.target.value);
                if (!editingCategory) {
                  setCatSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '')
                  );
                }
              }}
              placeholder="Ex: Robes & Bazin"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Slug URL</label>
            <input
              type="text"
              required
              value={catSlug}
              onChange={(e) => setCatSlug(e.target.value)}
              placeholder="robes-et-bazin"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Description</label>
            <textarea
              rows={3}
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Courte description de ce rayon..."
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 disabled:opacity-50 cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
