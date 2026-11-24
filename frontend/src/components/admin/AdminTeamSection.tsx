/**
 * Section Back-Office : Gestion de l'Équipe & Collaborateurs (US-36)
 *
 * Permet aux administrateurs (ROLE_ADMIN) d'ajouter, modifier les permissions,
 * suspendre et retirer des collaborateurs de gestion du Back-Office.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle,
  Ban,
  Edit2,
  Trash2,
  Copy,
  AlertTriangle,
  RefreshCw,
  X,
  Key,
} from 'lucide-react';
import { Collaborator, AdminPermission } from '../../types';
import { adminApi } from '../../services/api';

const ALL_PERMISSIONS: Array<{
  id: AdminPermission;
  label: string;
  description: string;
  badgeClass: string;
}> = [
  {
    id: 'DASHBOARD',
    label: 'Tableau de bord',
    description: 'Accès aux métriques, KPIs et indicateurs de performance',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'USERS',
    label: 'Utilisateurs & Rôles',
    description: 'Consultation, recherche et modération des comptes utilisateurs',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'PRODUCTS',
    label: 'Modération Annonces',
    description: 'Validation, activation et retrait des articles en vente',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'CATEGORIES',
    label: 'Rayons & Catégories',
    description: 'Création, modification et classement des rayons & catégories',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'ORDERS_PAYMENTS',
    label: 'Commandes & Paiements',
    description: 'Suivi logistique des expéditions et des transactions financières',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    id: 'REPORTS',
    label: 'Litiges & Signalements',
    description: 'Traitement des réclamations, signalements et litiges clients',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
];

interface AdminTeamSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  onCollaboratorsCountChange?: (count: number) => void;
}

export const AdminTeamSection: React.FC<AdminTeamSectionProps> = ({
  searchQuery,
  setSearchQuery,
  isCreateModalOpen,
  setIsCreateModalOpen,
  onCollaboratorsCountChange,
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtre statut
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Formulaire création
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    permissions: [] as AdminPermission[],
  });
  const [createdPasswordNotice, setCreatedPasswordNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal Modification Permissions
  const [editingCollab, setEditingCollab] = useState<Collaborator | null>(null);
  const [editPermissions, setEditPermissions] = useState<AdminPermission[]>([]);

  // Modal Confirmation Suppression
  const [deletingCollab, setDeletingCollab] = useState<Collaborator | null>(null);

  const fetchCollaborators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const isSuspendedParam =
        statusFilter === 'ALL' ? undefined : statusFilter === 'SUSPENDED';

      const res = await adminApi.getCollaborators({
        query: searchQuery.trim() || undefined,
        isSuspended: isSuspendedParam,
        size: 50,
      });

      if (res.data && res.data.data) {
        const list = res.data.data.content || [];
        setCollaborators(list);
        if (onCollaboratorsCountChange) {
          onCollaboratorsCountChange(res.data.data.totalElements ?? list.length);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de charger la liste des collaborateurs.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, onCollaboratorsCountChange]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  // Toggle permission dans formulaire création
  const toggleCreatePermission = (permId: AdminPermission) => {
    setCreateForm((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permId)
          : [...prev.permissions, permId],
      };
    });
  };

  // Toggle permission dans formulaire édition
  const toggleEditPermission = (permId: AdminPermission) => {
    setEditPermissions((prev) => {
      const exists = prev.includes(permId);
      return exists ? prev.filter((p) => p !== permId) : [...prev, permId];
    });
  };

  // Soumission création
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.permissions.length === 0) {
      setError('Veuillez sélectionner au moins une permission pour le collaborateur.');
      return;
    }

    if (createForm.password.trim() && createForm.password.trim().length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères (ou laissez-le vide pour génération automatique).');
      return;
    }

    let cleanPhone = createForm.phone.replace(/[\s.-]/g, '');
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.length === 9) {
        cleanPhone = '+221' + cleanPhone;
      } else {
        cleanPhone = '+' + cleanPhone;
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        phone: cleanPhone,
        email: createForm.email.trim() || undefined,
        password: createForm.password.trim() || undefined,
        permissions: createForm.permissions,
      };

      const res = await adminApi.createCollaborator(payload);
      const newCollab = res.data?.data;

      const generatedPwd =
        createForm.password.trim() ||
        (newCollab as any)?.temporaryPassword ||
        (newCollab as any)?.initialPassword ||
        'Defaut@2026';

      setCreatedPasswordNotice(generatedPwd);
      setSuccessMessage(`Collaborateur ${payload.firstName} ${payload.lastName} créé avec succès.`);

      setCreateForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
        permissions: [],
      });

      fetchCollaborators();
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.data && typeof errorData.data === 'object') {
        const details = Object.entries(errorData.data)
          .map(([field, msg]) => `${msg}`)
          .join(' · ');
        setError(details || errorData.message || 'Erreur lors de la création du collaborateur.');
      } else {
        setError(errorData?.message || 'Erreur lors de la création du collaborateur.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Soumission mise à jour permissions
  const handleUpdatePermissionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollab) return;

    try {
      setSubmitting(true);
      setError(null);
      await adminApi.updateCollaborator(editingCollab.id, {
        permissions: editPermissions,
      });

      setSuccessMessage(`Permissions de ${editingCollab.fullName} actualisées avec succès.`);
      setEditingCollab(null);
      fetchCollaborators();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de mettre à jour les permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  // Bascule suspension
  const handleToggleSuspension = async (collab: Collaborator) => {
    try {
      const nextSuspend = !collab.isSuspended;
      await adminApi.toggleCollaboratorSuspension(collab.id, nextSuspend);
      setSuccessMessage(
        nextSuspend
          ? `Le collaborateur ${collab.fullName} a été suspendu.`
          : `Le compte de ${collab.fullName} a été réactivé.`
      );
      fetchCollaborators();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la modification du statut.');
    }
  };

  // Suppression
  const handleDeleteConfirm = async () => {
    if (!deletingCollab) return;

    try {
      setSubmitting(true);
      await adminApi.deleteCollaborator(deletingCollab.id);
      setSuccessMessage(`Collaborateur ${deletingCollab.fullName} retiré avec succès.`);
      setDeletingCollab(null);
      fetchCollaborators();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du retrait du collaborateur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Alertes & Notifications */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-100 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barre de filtres de statut */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              {st === 'ALL' ? 'Tous' : st === 'ACTIVE' ? 'Actifs' : 'Suspendus'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => fetchCollaborators()}
          title="Actualiser la liste"
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-700' : ''}`} />
        </button>
      </div>

      {/* Tableau des collaborateurs */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {loading && collaborators.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Chargement des collaborateurs...
          </div>
        ) : collaborators.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Aucun collaborateur trouvé pour ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Collaborateur</th>
                  <th className="p-4">Téléphone</th>
                  <th className="p-4">Permissions attribuées</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {collaborators.map((c) => (
                  <tr key={c.id} className="hover:bg-purple-50/20 transition-colors">
                    {/* Collaborateur */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                          {c.firstName?.[0] || 'C'}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{c.fullName}</h4>
                          <span className="text-[11px] text-gray-400">
                            {c.email || 'Sans email'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Téléphone */}
                    <td className="p-4 font-mono font-bold text-gray-700">
                      {c.phone}
                    </td>

                    {/* Permissions */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        {c.permissions && c.permissions.length > 0 ? (
                          c.permissions.map((p) => {
                            const def = ALL_PERMISSIONS.find((perm) => perm.id === p);
                            return (
                              <span
                                key={p}
                                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                  def?.badgeClass || 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                              >
                                {def?.label || p}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-rose-500 italic">Aucune permission</span>
                        )}
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          c.isSuspended
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.isSuspended ? 'SUSPENDU' : 'ACTIF'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCollab(c);
                            setEditPermissions(c.permissions || []);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-purple-50 text-gray-600 hover:text-purple-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                          title="Modifier les permissions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Permissions</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleSuspension(c)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                            c.isSuspended
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {c.isSuspended ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Réactiver</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>Suspendre</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingCollab(c)}
                          className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Retirer ce collaborateur"
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
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1 : AJOUT DE COLLABORATEUR                         */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Ajouter un Collaborateur
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Définissez les accès et modules autorisés pour ce membre.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreatedPasswordNotice(null);
                  setIsCreateModalOpen(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdPasswordNotice ? (
              <div className="py-3 space-y-4">
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Compte collaborateur créé avec succès</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Veuillez copier et transmettre ce mot de passe temporaire au collaborateur pour sa première connexion :
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-emerald-200 font-mono text-xs font-bold text-gray-900 select-all">
                    <span className="flex-1 tracking-wider">{createdPasswordNotice}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdPasswordNotice);
                        setSuccessMessage('Mot de passe copié dans le presse-papier !');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copier
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedPasswordNotice(null);
                      setIsCreateModalOpen(false);
                    }}
                    className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      Prénom <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                      placeholder="Ex: Fatou"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-purple-700"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      Nom <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                      placeholder="Ex: Ndiaye"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-purple-700"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      Téléphone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="+221771234567"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-purple-700 font-mono"
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">Ex: +221771234567 ou 771234567</span>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      E-mail (Optionnel)
                    </label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="collaborateur@revibeflip.com"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-purple-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Mot de passe initial (Optionnel — généré automatiquement si vide)
                  </label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Laisser vide pour auto-génération sécurisée"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-purple-700"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Min. 6 caractères (ou laissez vide pour auto-génération sécurisée)</span>
                </div>

                {/* Permissions par module */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-gray-900 uppercase tracking-wider text-[11px]">
                      Permissions du Back-Office <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-purple-700">
                      {createForm.permissions.length} sélectionnée(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ALL_PERMISSIONS.map((perm) => {
                      const isChecked = createForm.permissions.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-300'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCreatePermission(perm.id)}
                            className="mt-0.5 w-4 h-4 rounded text-purple-700 accent-purple-700 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-xs text-gray-900">
                              {perm.label}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                              {perm.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {submitting ? 'Création en cours...' : 'Créer le collaborateur'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2 : MODIFIER LES PERMISSIONS                       */}
      {/* ======================================================== */}
      {editingCollab && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Modifier les permissions
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Collaborateur : {editingCollab.fullName} ({editingCollab.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCollab(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePermissionsSubmit} className="space-y-4">
              <div className="space-y-2">
                {ALL_PERMISSIONS.map((perm) => {
                  const isChecked = editPermissions.includes(perm.id);
                  return (
                    <label
                      key={perm.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEditPermission(perm.id)}
                        className="mt-0.5 w-4 h-4 rounded text-purple-700 accent-purple-700 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-xs text-gray-900">
                          {perm.label}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                          {perm.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setEditingCollab(null)}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3 : CONFIRMATION SUPPRESSION                       */}
      {/* ======================================================== */}
      {deletingCollab && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Retirer ce collaborateur ?
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Êtes-vous sûr de vouloir retirer <strong className="text-gray-900">{deletingCollab.fullName}</strong> de l'équipe ? Tous ses accès au Back-Office seront révoqués immédiatement.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-150">
              <button
                type="button"
                onClick={() => setDeletingCollab(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting ? 'Suppression...' : 'Confirmer le retrait'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
