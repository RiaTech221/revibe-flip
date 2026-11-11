import React from 'react';
import { X } from 'lucide-react';
import { AdminUserDetail } from '../../../types';

interface UserDetailModalProps {
  userDetail: AdminUserDetail | null;
  onClose: () => void;
  formatPrice: (price?: number | null) => string;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  userDetail,
  onClose,
  formatPrice,
}) => {
  if (!userDetail) return null;

  const { user, products, purchases, sales, totalEarned } = userDetail;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-gray-150 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-gray-150 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 font-black text-lg flex items-center justify-center border border-purple-200">
              {(user.firstName || user.fullName || 'U').charAt(0).toUpperCase()}
              {user.lastName?.charAt(0) || ''}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">{user.fullName}</h3>
              <p className="text-xs text-gray-500">
                {user.phone} • {user.role}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Statistiques clés utilisateur */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/60">
            <span className="text-[10px] text-gray-400 block font-bold uppercase">Annonces</span>
            <span className="text-lg font-black text-gray-900">{products.length}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/60">
            <span className="text-[10px] text-gray-400 block font-bold uppercase">Achats</span>
            <span className="text-lg font-black text-gray-900">{purchases.length}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/60">
            <span className="text-[10px] text-gray-400 block font-bold uppercase">Ventes</span>
            <span className="text-lg font-black text-gray-900">{sales.length}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/60">
            <span className="text-[10px] text-gray-400 block font-bold uppercase">Gains Nets</span>
            <span className="text-sm font-black text-purple-700">{formatPrice(totalEarned)}</span>
          </div>
        </div>

        {/* Annonces publiées par cet utilisateur */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
            Articles publiés ({products.length})
          </h4>
          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {products.length === 0 ? (
              <p className="text-xs text-gray-400 py-3">Aucun article publié par cet utilisateur.</p>
            ) : (
              products.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800 truncate">{p.title}</span>
                  <span className="text-purple-700 font-black">{formatPrice(p.price)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
