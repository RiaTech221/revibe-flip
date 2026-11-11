/**
 * Section de Gestion Admin : AdminCategoriesSection
 * 
 * Module de gestion dédié du back-office ReVibe FliP (AdminCategoriesSection).
 */

import React from 'react';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { Category } from '../../types';

interface AdminCategoriesSectionProps {
  categories: Category[];
  onOpenModal: (category?: Category) => void;
  onDeleteCategory: (categoryId: number) => void;
}

export const AdminCategoriesSection: React.FC<AdminCategoriesSectionProps> = ({
  categories,
  onOpenModal,
  onDeleteCategory,
}) => {
  return (
    <div className="space-y-5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Rayons & Catégories</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700">
            {categories.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenModal()}
          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-700/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ajouter une catégorie</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Nom de la catégorie</th>
                <th className="p-4">Identifiant Slug</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-purple-50/20 transition-colors">
                  <td className="p-4 font-bold text-gray-900">{c.name}</td>
                  <td className="p-4 font-mono text-gray-500">{c.slug}</td>
                  <td className="p-4 text-gray-600 max-w-xs truncate">{c.description || '—'}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenModal(c)}
                        className="p-1.5 text-gray-400 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(c.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
