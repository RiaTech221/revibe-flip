/**
 * Section de Gestion Admin : AdminUsersSection
 * 
 * Module de gestion dédié du back-office ReVibe FliP (AdminUsersSection).
 * Regroupe la gestion des utilisateurs marketplace et des collaborateurs de l'équipe (US-36).
 */

import React, { useState } from 'react';
import { Search, Ban, CheckCircle, ShieldCheck, Users, UserPlus } from 'lucide-react';
import { User } from '../../types';
import { AdminTeamSection } from './AdminTeamSection';
import { useAuth } from '../../context/AuthContext';

interface AdminUsersSectionProps {
  users: User[];
  userSearch: string;
  setUserSearch: (s: string) => void;
  userFilter: 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'ADMIN' | 'SELLER';
  setUserFilter: (f: 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'ADMIN' | 'SELLER') => void;
  onToggleSuspend: (userId: number, currentSuspended: boolean) => void;
  onUpdateRole: (userId: number, currentRole: 'ROLE_USER' | 'ROLE_ADMIN') => void;
  onViewDetail: (userId: number) => void;
  initialSubTab?: 'marketplace' | 'collaborators';
}

export const AdminUsersSection: React.FC<AdminUsersSectionProps> = ({
  users,
  userSearch,
  setUserSearch,
  userFilter,
  setUserFilter,
  onToggleSuspend,
  onUpdateRole,
  onViewDetail,
  initialSubTab = 'marketplace',
}) => {
  const { isAdmin } = useAuth();
  const [subTab, setSubTab] = useState<'marketplace' | 'collaborators'>(initialSubTab);

  // État partagé pour les collaborateurs
  const [collabSearch, setCollabSearch] = useState('');
  const [isCollabCreateOpen, setIsCollabCreateOpen] = useState(false);
  const [collabCount, setCollabCount] = useState(0);

  const filteredUsers = users.filter((u) => {
    if (userFilter === 'ACTIVE' && u.isSuspended) return false;
    if (userFilter === 'SUSPENDED' && !u.isSuspended) return false;
    if (userFilter === 'ADMIN' && u.role !== 'ROLE_ADMIN') return false;
    if (userSearch) {
      const q = userSearch.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 text-xs">
      {/* En-tête principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Utilisateurs & Rôles</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700">
            {subTab === 'marketplace' ? users.length : collabCount}
          </span>
        </div>

        {/* Barre d'action droite : Recherche & Bouton d'ajout */}
        <div className="flex items-center gap-3">
          {subTab === 'marketplace' ? (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-700"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, téléphone..."
                  value={collabSearch}
                  onChange={(e) => setCollabSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-700"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsCollabCreateOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ajouter un collaborateur</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Onglets de bascule Utilisateurs / Collaborateurs (si administrateur) */}
      {isAdmin && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('marketplace')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              subTab === 'marketplace'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Utilisateurs Marketplace</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('collaborators')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              subTab === 'collaborators'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Collaborateurs</span>
          </button>
        </div>
      )}

      {/* Contenu selon l'onglet actif */}
      {subTab === 'collaborators' && isAdmin ? (
        <AdminTeamSection
          searchQuery={collabSearch}
          setSearchQuery={setCollabSearch}
          isCreateModalOpen={isCollabCreateOpen}
          setIsCreateModalOpen={setIsCollabCreateOpen}
          onCollaboratorsCountChange={setCollabCount}
        />
      ) : (
        <div className="space-y-4">
          {/* Filtres de statut utilisateurs marketplace */}
          <div className="flex items-center gap-2">
            {(['ALL', 'ACTIVE', 'SUSPENDED', 'ADMIN'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setUserFilter(filter)}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  userFilter === filter
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                {filter === 'ALL'
                  ? 'Tous'
                  : filter === 'ACTIVE'
                  ? 'Actifs'
                  : filter === 'SUSPENDED'
                  ? 'Suspendus'
                  : 'Admins'}
              </button>
            ))}
          </div>

          {/* Tableau utilisateurs marketplace */}
          <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                Aucun utilisateur ne correspond à votre recherche.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Utilisateur</th>
                      <th className="p-4">Téléphone</th>
                      <th className="p-4">Rôle</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                              {u.fullName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">{u.fullName}</h4>
                              <span className="text-[11px] text-gray-400">{u.email || 'Sans email'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-gray-700">{u.phone}</td>
                        <td className="p-4">
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => onUpdateRole(u.id, u.role as any)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                                u.role === 'ROLE_ADMIN'
                                  ? 'bg-purple-700 text-white shadow-xs'
                                  : u.role === 'ROLE_COLLABORATOR'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                              }`}
                              title="Cliquer pour changer le rôle"
                            >
                              {u.role === 'ROLE_ADMIN'
                                ? 'ADMINISTRATEUR'
                                : u.role === 'ROLE_COLLABORATOR'
                                ? 'COLLABORATEUR'
                                : 'UTILISATEUR'}
                            </button>
                          ) : (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                                u.role === 'ROLE_ADMIN'
                                  ? 'bg-purple-700 text-white shadow-xs'
                                  : u.role === 'ROLE_COLLABORATOR'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {u.role === 'ROLE_ADMIN'
                                ? 'ADMINISTRATEUR'
                                : u.role === 'ROLE_COLLABORATOR'
                                ? 'COLLABORATEUR'
                                : 'UTILISATEUR'}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              u.isSuspended
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.isSuspended ? 'SUSPENDU' : 'ACTIF'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(isAdmin || u.role === 'ROLE_USER') && (
                              <button
                                type="button"
                                onClick={() => onToggleSuspend(u.id, u.isSuspended)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                                  u.isSuspended
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                }`}
                              >
                                {u.isSuspended ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                <span>{u.isSuspended ? 'Réactiver' : 'Suspendre'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onViewDetail(u.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-purple-50 text-gray-600 hover:text-purple-700 font-bold text-xs transition-colors cursor-pointer"
                            >
                              Détails
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
