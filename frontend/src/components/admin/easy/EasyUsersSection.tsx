import React, { useState } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { User } from '../../../types';

interface EasyUsersSectionProps {
  users: User[];
  onToggleSuspend: (userId: number, currentSuspended: boolean) => void;
  currentUser: User | null;
}

export const EasyUsersSection: React.FC<EasyUsersSectionProps> = ({
  users,
  onToggleSuspend,
  currentUser,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'ADMIN'>('ALL');

  const filteredUsers = users.filter((u) => {
    const isSuspended = Boolean(u.isSuspended);
    const isAdmin = u.role === 'ROLE_ADMIN';

    if (filter === 'ACTIVE' && isSuspended) return false;
    if (filter === 'SUSPENDED' && !isSuspended) return false;
    if (filter === 'ADMIN' && !isAdmin) return false;

    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.phone.includes(term) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.city && u.city.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. EN-TÊTE FACILE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Gestion des membres</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Membres & Comptes Utilisateurs
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Consultez les acheteurs et vendeurs inscrits. En cas de problème ou d'abus, vous pouvez bloquer un compte en un clic.
            </p>
          </div>
        </div>

        {/* 2. RECHERCHE & FILTRES SIMPLES */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, téléphone (ex: 77...)..."
              className="w-full h-11 pl-10 pr-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === 'ALL' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Tous ({users.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Comptes actifs 🟢
            </button>
            <button
              onClick={() => setFilter('SUSPENDED')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === 'SUSPENDED' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Bloqués ⛔
            </button>
            <button
              onClick={() => setFilter('ADMIN')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === 'ADMIN' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Administrateurs 👑
            </button>
          </div>
        </div>
      </div>

      {/* 3. GRILLE DES UTILISATEURS */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-150">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-gray-800">Aucun membre trouvé</h4>
          <p className="text-xs text-gray-400 mt-1">
            Vérifiez l'orthographe du nom ou du numéro de téléphone.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const isSuspended = Boolean(u.isSuspended);
            const isAdmin = u.role === 'ROLE_ADMIN';
            const isMe = currentUser?.id === u.id;

            return (
              <div
                key={u.id}
                className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm flex flex-col justify-between gap-4 hover:border-purple-200 transition-all"
              >
                <div className="space-y-3">
                  {/* Avatar & Nom */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
                        {u.firstName?.[0]?.toUpperCase()}
                        {u.lastName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 leading-snug">
                          {u.firstName} {u.lastName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isAdmin ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              👑 Administrateur
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              🛍️ Client / Vendeur
                            </span>
                          )}
                          {isMe && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              (C'est vous)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coordonnées claires */}
                  <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <strong className="text-gray-900">{u.phone}</strong>
                    </div>
                    {u.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-700 truncate">{u.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-gray-700">{u.city || 'Dakar, Sénégal'}</span>
                    </div>
                  </div>

                  {/* État du compte */}
                  <div className="flex items-center gap-2">
                    {isSuspended ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <UserX className="w-3.5 h-3.5" />
                        <span>Compte bloqué (ne peut pas se connecter)</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Compte en règle</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bouton d'action */}
                {!isMe && !isAdmin && (
                  <div className="pt-2 border-t border-gray-100">
                    {isSuspended ? (
                      <button
                        type="button"
                        onClick={() => onToggleSuspend(u.id, true)}
                        className="w-full h-10 px-4 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Débloquer ce compte</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggleSuspend(u.id, false)}
                        className="w-full h-10 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <UserX className="w-4 h-4" />
                        <span>Bloquer ce compte</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
