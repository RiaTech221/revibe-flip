/**
 * Section de Gestion Admin : AdminContentManager
 * 
 * Module de gestion dédié du back-office ReVibe FliP (AdminContentManager).
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminCmsApi } from '../../services/api';
import {
  CmsPage,
  PageVersion,
  FaqItem,
  ContactMessage,
  FooterConfig,
  AnnouncementBanner,
  MediaAsset,
  PageStatus,
  FooterColumn,
  ContactMessageStatus
} from '../../types';
import {
  FileText,
  HelpCircle,
  Layout,
  Share2,
  BellRing,
  Image as ImageIcon,
  Mail,
  Plus,
  Search,
  Edit2,
  Trash2,
  History,
  CheckCircle,
  Eye,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Upload,
  Save,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const AdminContentManager: React.FC = () => {
  type SubTab = 'pages' | 'faq' | 'footer' | 'socials' | 'banners' | 'media' | 'contact';
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('pages');

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // ==========================================
  // 1. ÉTAT : PAGES CMS
  // ==========================================
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [pageSearch, setPageSearch] = useState('');
  const [pageStatusFilter, setPageStatusFilter] = useState<string>('ALL');
  const [pagesLoading, setPagesLoading] = useState(false);

  // Modal Page Edit/Create
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [pageForm, setPageForm] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'PUBLISHED' as PageStatus,
    showInFooter: true,
    footerColumn: 'HELP' as FooterColumn,
    sortOrder: 0,
    pdfUrl: '',
    changeSummary: '',
  });
  const [editorPreviewMode, setEditorPreviewMode] = useState<'write' | 'preview'>('write');

  // Modal Versions
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [currentVersionPage, setCurrentVersionPage] = useState<CmsPage | null>(null);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const fetchPages = () => {
    setPagesLoading(true);
    adminCmsApi.getPages({
      search: pageSearch || undefined,
      status: pageStatusFilter !== 'ALL' ? pageStatusFilter : undefined,
      size: 50,
    })
      .then((res) => {
        if (res.data?.data) {
          setPages(res.data.data.content || []);
        }
      })
      .catch((err) => showError('Erreur lors du chargement des pages.'))
      .finally(() => setPagesLoading(false));
  };

  useEffect(() => {
    if (activeSubTab === 'pages') fetchPages();
  }, [activeSubTab, pageStatusFilter]);

  const handleOpenCreatePage = () => {
    setEditingPageId(null);
    setPageForm({
      title: '',
      slug: '',
      content: '<h2>Titre de section</h2>\n<p>Rédigez votre contenu ici...</p>',
      status: 'PUBLISHED',
      showInFooter: true,
      footerColumn: 'HELP',
      sortOrder: 0,
      pdfUrl: '',
      changeSummary: 'Création initiale',
    });
    setEditorPreviewMode('write');
    setIsPageModalOpen(true);
  };

  const handleOpenEditPage = (page: CmsPage) => {
    setEditingPageId(page.id as any);
    setPageForm({
      title: page.title,
      slug: page.slug,
      content: page.content,
      status: page.status,
      showInFooter: page.showInFooter,
      footerColumn: page.footerColumn,
      sortOrder: page.sortOrder,
      pdfUrl: page.pdfUrl || '',
      changeSummary: '',
    });
    setEditorPreviewMode('write');
    setIsPageModalOpen(true);
  };

  const handleSavePage = async () => {
    if (!pageForm.title.trim() || !pageForm.content.trim()) {
      showError('Le titre et le contenu sont obligatoires.');
      return;
    }

    try {
      if (editingPageId) {
        await adminCmsApi.updatePage(Number(editingPageId), pageForm);
        showToast('Page mise à jour avec succès.');
      } else {
        await adminCmsApi.createPage(pageForm);
        showToast('Page créée avec succès.');
      }
      setIsPageModalOpen(false);
      fetchPages();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de l\'enregistrement de la page.');
    }
  };

  const handleDeletePage = async (page: CmsPage) => {
    if (page.isSystemPage) {
      alert("Cette page légale système (CGU, Confidentialité, Mentions Légales) est essentielle et ne peut pas être supprimée.");
      return;
    }

    let force = false;
    if (page.showInFooter) {
      if (!window.confirm(`⚠️ Attention : La page "${page.title}" est actuellement affichée dans le footer public. Voulez-vous vraiment la supprimer ?`)) {
        return;
      }
      force = true;
    } else {
      if (!window.confirm(`Confirmez-vous la suppression définitive de la page "${page.title}" ?`)) {
        return;
      }
    }

    try {
      await adminCmsApi.deletePage(page.id, force);
      showToast('Page supprimée avec succès.');
      fetchPages();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const handleViewVersions = async (page: CmsPage) => {
    setCurrentVersionPage(page);
    setIsVersionModalOpen(true);
    setVersionsLoading(true);
    try {
      const res = await adminCmsApi.getPageVersions(page.id);
      setVersions(res.data?.data || []);
    } catch (err) {
      showError('Erreur chargement des versions.');
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!currentVersionPage) return;
    if (!window.confirm(`Restaurer le contenu de la version ${versionNumber} pour la page "${currentVersionPage.title}" ? Une nouvelle version de sauvegarde sera créée.`)) {
      return;
    }

    try {
      await adminCmsApi.restoreVersion(currentVersionPage.id, versionNumber);
      showToast(`Version ${versionNumber} restaurée avec succès.`);
      setIsVersionModalOpen(false);
      fetchPages();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la restauration.');
    }
  };

  // Helper pour insérer du balisage dans l'éditeur
  const insertTag = (openTag: string, closeTag: string) => {
    const textarea = document.getElementById('cms-content-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = openTag + (selected || 'Texte') + closeTag;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setPageForm((prev) => ({ ...prev, content: newContent }));
  };

  // ==========================================
  // 2. ÉTAT : FAQ
  // ==========================================
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'Commandes',
    sortOrder: 0,
    isPublished: true,
  });

  const fetchFaq = () => {
    setFaqLoading(true);
    adminCmsApi.getFaq()
      .then((res) => {
        if (res.data?.data) setFaqItems(res.data.data);
      })
      .catch(() => showError('Erreur chargement FAQ.'))
      .finally(() => setFaqLoading(false));
  };

  useEffect(() => {
    if (activeSubTab === 'faq') fetchFaq();
  }, [activeSubTab]);

  const handleSaveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      showError('Question et réponse obligatoires.');
      return;
    }

    try {
      if (editingFaqId) {
        await adminCmsApi.updateFaq(editingFaqId, faqForm);
        showToast('Question FAQ modifiée.');
      } else {
        await adminCmsApi.createFaq(faqForm);
        showToast('Question FAQ créée.');
      }
      setIsFaqModalOpen(false);
      fetchFaq();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur enregistrement FAQ.');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!window.confirm('Supprimer cette question FAQ ?')) return;
    try {
      await adminCmsApi.deleteFaq(id);
      showToast('Question supprimée.');
      fetchFaq();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur suppression.');
    }
  };

  // ==========================================
  // 3. ÉTAT : FOOTER & RÉSEAUX SOCIAUX
  // ==========================================
  const [footerConfig, setFooterConfig] = useState<FooterConfig | null>(null);
  const [footerSaving, setFooterSaving] = useState(false);
  const [socialsForm, setSocialsForm] = useState<Record<string, string>>({
    instagram: '',
    facebook: '',
    tiktok: '',
    whatsapp: '',
    x: '',
    youtube: '',
    linkedin: '',
  });

  const fetchFooterConfig = () => {
    adminCmsApi.getFooter()
      .then((res) => {
        if (res.data?.data) {
          const cfg = res.data.data;
          setFooterConfig(cfg);
          setSocialsForm({
            instagram: cfg.socialLinks?.instagram || '',
            facebook: cfg.socialLinks?.facebook || '',
            tiktok: cfg.socialLinks?.tiktok || '',
            whatsapp: cfg.socialLinks?.whatsapp || '',
            x: cfg.socialLinks?.x || '',
            youtube: cfg.socialLinks?.youtube || '',
            linkedin: cfg.socialLinks?.linkedin || '',
          });
        }
      })
      .catch(() => showError('Erreur chargement footer.'));
  };

  useEffect(() => {
    if (activeSubTab === 'footer' || activeSubTab === 'socials') fetchFooterConfig();
  }, [activeSubTab]);

  const handleSaveFooter = async () => {
    if (!footerConfig) return;
    setFooterSaving(true);
    try {
      await adminCmsApi.updateFooter({
        catchphrase: footerConfig.catchphrase,
        copyright: footerConfig.copyright,
        supportEmail: footerConfig.supportEmail,
        supportPhone: footerConfig.supportPhone,
        supportAddress: footerConfig.supportAddress,
        supportHours: footerConfig.supportHours,
        logoDarkBgUrl: footerConfig.logoDarkBgUrl,
        logoLightBgUrl: footerConfig.logoLightBgUrl,
        socialLinks: socialsForm,
      });
      showToast('Configuration du footer mise à jour.');
      fetchFooterConfig();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur sauvegarde footer.');
    } finally {
      setFooterSaving(false);
    }
  };

  // ==========================================
  // 4. ÉTAT : BANDEAUX & ACCUEIL
  // ==========================================
  const [announcement, setAnnouncement] = useState<AnnouncementBanner | null>(null);
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  const fetchAnnouncement = () => {
    adminCmsApi.getAnnouncement()
      .then((res) => {
        if (res.data?.data) setAnnouncement(res.data.data);
      })
      .catch(() => showError('Erreur chargement annonce.'));
  };

  useEffect(() => {
    if (activeSubTab === 'banners') fetchAnnouncement();
  }, [activeSubTab]);

  const handleSaveAnnouncement = async () => {
    if (!announcement) return;
    setAnnouncementSaving(true);
    try {
      await adminCmsApi.updateAnnouncement({
        enabled: announcement.enabled,
        message: announcement.message,
        link: announcement.link,
        startDate: announcement.startDate,
        endDate: announcement.endDate,
      });
      showToast('Bandeau d\'annonce mis à jour.');
      fetchAnnouncement();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur enregistrement annonce.');
    } finally {
      setAnnouncementSaving(false);
    }
  };

  // ==========================================
  // 5. ÉTAT : MÉDIATHÈQUE
  // ==========================================
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altTextInput, setAltTextInput] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchMedia = () => {
    setMediaLoading(true);
    adminCmsApi.getMedia({ size: 50 })
      .then((res) => {
        if (res.data?.data) setMediaAssets(res.data.data.content || []);
      })
      .catch(() => showError('Erreur chargement médiathèque.'))
      .finally(() => setMediaLoading(false));
  };

  useEffect(() => {
    if (activeSubTab === 'media') fetchMedia();
  }, [activeSubTab]);

  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showError('Veuillez sélectionner un fichier.');
      return;
    }

    if (selectedFile.name.toLowerCase().endsWith('.svg')) {
      showError('Format SVG refusé pour des raisons de sécurité.');
      return;
    }

    const isImage = selectedFile.type.startsWith('image/');
    if (isImage && altTextInput.trim().length < 3) {
      showError('Le texte alternatif (alt) est obligatoire pour les images.');
      return;
    }

    setUploadingMedia(true);
    try {
      await adminCmsApi.uploadMedia(selectedFile, altTextInput.trim());
      showToast('Fichier téléversé avec succès.');
      setSelectedFile(null);
      setAltTextInput('');
      fetchMedia();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur téléversement.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDeleteMedia = async (id: number) => {
    if (!window.confirm('Supprimer ce fichier média ? Les pages utilisant ce lien afficheront une image brisée.')) {
      return;
    }
    try {
      await adminCmsApi.deleteMedia(id);
      showToast('Média supprimé.');
      fetchMedia();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur suppression média.');
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // ==========================================
  // 6. ÉTAT : MESSAGES DE CONTACT
  // ==========================================
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [contactStatusFilter, setContactStatusFilter] = useState<string>('ALL');
  const [contactLoading, setContactLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');

  const fetchContactMessages = () => {
    setContactLoading(true);
    adminCmsApi.getContactMessages({
      status: contactStatusFilter !== 'ALL' ? contactStatusFilter : undefined,
      size: 50,
    })
      .then((res) => {
        if (res.data?.data) setContactMessages(res.data.data.content || []);
      })
      .catch(() => showError('Erreur chargement messages.'))
      .finally(() => setContactLoading(false));
  };

  useEffect(() => {
    if (activeSubTab === 'contact') fetchContactMessages();
  }, [activeSubTab, contactStatusFilter]);

  const handleUpdateContactStatus = async (status: ContactMessageStatus) => {
    if (!selectedMessage) return;
    try {
      await adminCmsApi.updateContactMessage(selectedMessage.id, {
        status,
        adminNotes: adminNotesInput.trim() || undefined,
      });
      showToast('Message de contact mis à jour.');
      setSelectedMessage(null);
      fetchContactMessages();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur mise à jour message.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* TOASTS NOTIFICATIONS */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2 animate-bounceIn">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-rose-600 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2 animate-bounceIn">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* HEADER DE GESTION CONTENUS */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">CMS & Éditorial</span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">
            Gestion des Contenus, Pages & Footer
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Modifiez en temps réel les textes, pages légales, foire aux questions, liens et réseaux sociaux sans redéploiement.
          </p>
        </div>
      </div>

      {/* SOUS-NAVIGATION ONGLETS CMS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('pages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'pages'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Pages ({pages.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('faq')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'faq'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>FAQ ({faqItems.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('footer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'footer'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Footer & Coordonnées</span>
        </button>

        <button
          onClick={() => setActiveSubTab('socials')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'socials'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Réseaux Sociaux</span>
        </button>

        <button
          onClick={() => setActiveSubTab('banners')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'banners'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Bandeau d'Annonce</span>
        </button>

        <button
          onClick={() => setActiveSubTab('media')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'media'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Médiathèque</span>
        </button>

        <button
          onClick={() => setActiveSubTab('contact')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'contact'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Messages reçus ({contactMessages.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. SECTION PAGES CMS */}
      {/* ======================================================== */}
      {activeSubTab === 'pages' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPages()}
                  placeholder="Rechercher par titre ou URL..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-purple-600"
                />
              </div>
              <select
                value={pageStatusFilter}
                onChange={(e) => setPageStatusFilter(e.target.value)}
                className="py-2 px-3 text-xs bg-white rounded-xl border border-gray-200"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PUBLISHED">Publié</option>
                <option value="DRAFT">Brouillon</option>
              </select>
            </div>

            <button
              onClick={handleOpenCreatePage}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-2xl shadow-xs transition-colors self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une page</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Titre & URL</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Footer</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Mise à jour</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pages.map((p) => (
                    <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{p.title}</span>
                          {p.isSystemPage && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                              Système
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-purple-700">/{p.slug}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {p.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {p.showInFooter ? (
                          <span className="text-[11px] text-gray-700 font-medium">
                            {p.footerColumn === 'HELP' ? 'Colonne Aide' : 'Colonne Légal'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Non affiché</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleViewVersions(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-gray-700 text-[10px] font-bold transition-colors"
                          title="Voir l'historique des versions"
                        >
                          <History className="w-3 h-3" />
                          <span>v{p.currentVersion || 1}</span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-gray-500 text-[11px]">
                        {new Date(p.updatedAt || p.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-1">
                        <Link
                          to={p.slug === 'cgu' || p.slug === 'confidentialite' || p.slug === 'mentions-legales' || p.slug === 'comment-ca-marche' ? `/${p.slug}` : `/p/${p.slug}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-purple-700 inline-block rounded-lg hover:bg-gray-100"
                          title="Aperçu public"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleOpenEditPage(p)}
                          className="p-1.5 text-gray-400 hover:text-purple-700 rounded-lg hover:bg-gray-100"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeletePage(p)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SECTION FAQ */}
      {/* ======================================================== */}
      {activeSubTab === 'faq' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Gérez les questions fréquentes affichées en accordéon sur la page publique <strong>/faq</strong>.
            </p>
            <button
              onClick={() => {
                setEditingFaqId(null);
                setFaqForm({
                  question: '',
                  answer: '',
                  category: 'Commandes',
                  sortOrder: faqItems.length + 1,
                  isPublished: true,
                });
                setIsFaqModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-2xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une question</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-150 shadow-xs divide-y divide-gray-100 overflow-hidden">
            {faqItems.map((f) => (
              <div key={f.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-gray-50/50">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-black uppercase">
                      {f.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Ordre: {f.sortOrder}</span>
                    {!f.isPublished && (
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[9px] font-bold">
                        Masqué
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900">{f.question}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{f.answer}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingFaqId(f.id);
                      setFaqForm({
                        question: f.question,
                        answer: f.answer,
                        category: f.category,
                        sortOrder: f.sortOrder,
                        isPublished: f.isPublished,
                      });
                      setIsFaqModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-purple-700 rounded-xl hover:bg-gray-100"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(f.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SECTION FOOTER & COORDONNÉES */}
      {/* ======================================================== */}
      {activeSubTab === 'footer' && footerConfig && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-black text-gray-900">Textes & Paramètres du Footer</h2>
              <p className="text-xs text-gray-500">Ces informations sont directement affichées dans le pied de page du site.</p>
            </div>
            <button
              onClick={handleSaveFooter}
              disabled={footerSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-2xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{footerSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="md:col-span-2">
              <label className="block font-bold text-gray-700 mb-1">Phrase d'accroche sous le logo</label>
              <textarea
                rows={2}
                value={footerConfig.catchphrase}
                onChange={(e) => setFooterConfig({ ...footerConfig, catchphrase: e.target.value })}
                className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Email du support public</label>
              <input
                type="email"
                value={footerConfig.supportEmail}
                onChange={(e) => setFooterConfig({ ...footerConfig, supportEmail: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Téléphone / WhatsApp support</label>
              <input
                type="text"
                value={footerConfig.supportPhone}
                onChange={(e) => setFooterConfig({ ...footerConfig, supportPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Adresse postale / Ville</label>
              <input
                type="text"
                value={footerConfig.supportAddress}
                onChange={(e) => setFooterConfig({ ...footerConfig, supportAddress: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Horaires d'ouverture</label>
              <input
                type="text"
                value={footerConfig.supportHours}
                onChange={(e) => setFooterConfig({ ...footerConfig, supportHours: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-gray-700 mb-1">Texte du Copyright (utilisez {"{year}"} pour l'année automatique)</label>
              <input
                type="text"
                value={footerConfig.copyright}
                onChange={(e) => setFooterConfig({ ...footerConfig, copyright: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SECTION RÉSEAUX SOCIAUX */}
      {/* ======================================================== */}
      {activeSubTab === 'socials' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-black text-gray-900">Liens des Réseaux Sociaux</h2>
              <p className="text-xs text-gray-500">
                <strong>Règle :</strong> Une icône sans URL renseignée n'est pas affichée sur le site public.
              </p>
            </div>
            <button
              onClick={handleSaveFooter}
              disabled={footerSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-2xl shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les liens</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Instagram</label>
              <input
                type="url"
                placeholder="https://instagram.com/revibeflip"
                value={socialsForm.instagram}
                onChange={(e) => setSocialsForm({ ...socialsForm, instagram: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Facebook</label>
              <input
                type="url"
                placeholder="https://facebook.com/revibeflip"
                value={socialsForm.facebook}
                onChange={(e) => setSocialsForm({ ...socialsForm, facebook: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">TikTok</label>
              <input
                type="url"
                placeholder="https://tiktok.com/@revibeflip"
                value={socialsForm.tiktok}
                onChange={(e) => setSocialsForm({ ...socialsForm, tiktok: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">WhatsApp (lien direct wa.me)</label>
              <input
                type="url"
                placeholder="https://wa.me/221771234567"
                value={socialsForm.whatsapp}
                onChange={(e) => setSocialsForm({ ...socialsForm, whatsapp: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">X (ex-Twitter)</label>
              <input
                type="url"
                placeholder="https://x.com/revibeflip"
                value={socialsForm.x}
                onChange={(e) => setSocialsForm({ ...socialsForm, x: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">YouTube</label>
              <input
                type="url"
                placeholder="https://youtube.com/@revibeflip"
                value={socialsForm.youtube}
                onChange={(e) => setSocialsForm({ ...socialsForm, youtube: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">LinkedIn</label>
              <input
                type="url"
                placeholder="https://linkedin.com/company/revibeflip"
                value={socialsForm.linkedin}
                onChange={(e) => setSocialsForm({ ...socialsForm, linkedin: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. SECTION BANDEAUX D'ANNONCE */}
      {/* ======================================================== */}
      {activeSubTab === 'banners' && announcement && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-black text-gray-900">Bandeau d'Annonce Supérieur</h2>
              <p className="text-xs text-gray-500">Message promotionnel ou important affiché au tout sommet du site.</p>
            </div>
            <button
              onClick={handleSaveAnnouncement}
              disabled={announcementSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-2xl shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer le bandeau</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <div>
                <span className="font-bold text-purple-950 block">Activer le bandeau d'annonce</span>
                <span className="text-[11px] text-purple-700">Affiche le message en haut de la vitrine</span>
              </div>
              <input
                type="checkbox"
                checked={announcement.enabled}
                onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
                className="w-5 h-5 accent-purple-700"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Texte de l'annonce</label>
              <input
                type="text"
                value={announcement.message}
                onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                placeholder="Ex : 🎉 Livraison offerte ce week-end à Dakar !"
                className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Lien de destination (facultatif)</label>
              <input
                type="text"
                value={announcement.link || ''}
                onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })}
                placeholder="/catalog ou /comment-ca-marche"
                className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. SECTION MÉDIATHÈQUE */}
      {/* ======================================================== */}
      {activeSubTab === 'media' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-gray-900">Téléverser un média (JPG, PNG, WebP ou PDF)</h3>
            <form onSubmit={handleUploadMedia} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Fichier (SVG refusé)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full p-2 bg-gray-50 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Texte alternatif (alt obligat. pour images)</label>
                <input
                  type="text"
                  placeholder="Ex : Guide des tailles en wax"
                  value={altTextInput}
                  onChange={(e) => setAltTextInput(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={uploadingMedia || !selectedFile}
                  className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingMedia ? 'Téléversement...' : 'Téléverser'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mediaAssets.map((asset) => {
              const isPdf = asset.fileType === 'application/pdf';
              return (
                <div key={asset.id} className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-2xs group flex flex-col">
                  <div className="h-32 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                    {isPdf ? (
                      <div className="text-center p-3">
                        <FileText className="w-8 h-8 text-rose-600 mx-auto" />
                        <span className="text-[10px] font-bold text-gray-700 block mt-1 truncate">PDF</span>
                      </div>
                    ) : (
                      <img
                        src={asset.url}
                        alt={asset.altText}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between text-xs space-y-2">
                    <div>
                      <p className="font-bold text-gray-900 truncate text-[11px]" title={asset.originalFilename}>
                        {asset.originalFilename}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {(asset.fileSize / 1024).toFixed(0)} Ko
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => handleCopyLink(asset.url)}
                        className="p-1.5 text-gray-500 hover:text-purple-700 rounded-lg hover:bg-gray-100 flex items-center gap-1 text-[10px]"
                        title="Copier le lien"
                      >
                        {copiedUrl === asset.url ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copier</span>
                      </button>

                      <button
                        onClick={() => handleDeleteMedia(asset.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. SECTION MESSAGES DE CONTACT */}
      {/* ======================================================== */}
      {activeSubTab === 'contact' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select
              value={contactStatusFilter}
              onChange={(e) => setContactStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-white rounded-xl border border-gray-200"
            >
              <option value="ALL">Tous les messages</option>
              <option value="NEW">Nouveaux</option>
              <option value="RESOLVED">Traités</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-gray-150 shadow-xs divide-y divide-gray-100 overflow-hidden">
            {contactMessages.map((msg) => (
              <div key={msg.id} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-gray-50/50">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        msg.status === 'NEW'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {msg.status === 'NEW' ? 'Nouveau' : 'Traité'}
                    </span>
                    <span className="font-bold text-gray-900 text-xs">{msg.fullName}</span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-gray-500 text-xs">{msg.email || msg.phone}</span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-gray-400 text-[10px]">
                      {new Date(msg.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>

                  <h4 className="font-black text-xs text-gray-900">{msg.subject}</h4>
                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {msg.message}
                  </p>

                  {msg.adminNotes && (
                    <p className="text-[11px] text-purple-800 bg-purple-50 p-2 rounded-lg">
                      <strong>Note interne :</strong> {msg.adminNotes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedMessage(msg);
                      setAdminNotesInput(msg.adminNotes || '');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                  >
                    Traiter / Répondre
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TRAITEMENT MESSAGE */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-black text-base text-gray-900">
              Traiter le message de {selectedMessage.fullName}
            </h3>

            <div className="text-xs space-y-2">
              <p><strong>Sujet :</strong> {selectedMessage.subject}</p>
              <p><strong>Contact :</strong> {selectedMessage.email || selectedMessage.phone}</p>
              <p className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-gray-700">
                {selectedMessage.message}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Notes internes admin</label>
              <textarea
                rows={3}
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                placeholder="Renseignez ici la réponse apportée ou les détails de suivi..."
                className="w-full p-2.5 text-xs rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Fermer
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateContactStatus('NEW')}
                  className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
                >
                  Garder en Nouveau
                </button>
                <button
                  onClick={() => handleUpdateContactStatus('RESOLVED')}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Marquer comme Traité
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION / ÉDITION DE PAGE AVEC ÉDITEUR RICHE ET APERÇU */}
      {isPageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <h3 className="font-black text-lg text-gray-900">
                {editingPageId ? 'Modifier la page' : 'Créer une nouvelle page'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorPreviewMode('write')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    editorPreviewMode === 'write' ? 'bg-purple-700 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Édition HTML
                </button>
                <button
                  onClick={() => setEditorPreviewMode('preview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    editorPreviewMode === 'preview' ? 'bg-purple-700 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Aperçu en direct
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Titre de la page *</label>
                <input
                  type="text"
                  value={pageForm.title}
                  onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                  placeholder="Ex : Guide de vente express"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Adresse URL (slug)</label>
                <input
                  type="text"
                  value={pageForm.slug}
                  onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                  placeholder="guide-vente-express"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Statut de publication</label>
                <select
                  value={pageForm.status}
                  onChange={(e) => setPageForm({ ...pageForm, status: e.target.value as PageStatus })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                >
                  <option value="PUBLISHED">Publié (visible publiquement)</option>
                  <option value="DRAFT">Brouillon (visible par admin uniquement)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Colonne du footer</label>
                <select
                  value={pageForm.footerColumn}
                  onChange={(e) => setPageForm({ ...pageForm, footerColumn: e.target.value as FooterColumn })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                >
                  <option value="HELP">Colonne 3 : Aide & Support</option>
                  <option value="LEGAL">Colonne 4 : Informations Légales</option>
                  <option value="NONE">Ne pas afficher dans le footer</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Lien PDF téléchargeable (facultatif)</label>
                <input
                  type="text"
                  value={pageForm.pdfUrl}
                  onChange={(e) => setPageForm({ ...pageForm, pdfUrl: e.target.value })}
                  placeholder="/api/media/mon-document.pdf"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Résumé de modification (versioning)</label>
                <input
                  type="text"
                  value={pageForm.changeSummary}
                  onChange={(e) => setPageForm({ ...pageForm, changeSummary: e.target.value })}
                  placeholder="Ex : Mise à jour des articles interdits"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                />
              </div>
            </div>

            {/* ÉDITEUR OU APERÇU */}
            {editorPreviewMode === 'write' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 p-2 bg-gray-100 rounded-xl flex-wrap text-xs">
                  <button type="button" onClick={() => insertTag('<h2>', '</h2>')} className="px-2 py-1 bg-white rounded border border-gray-200 font-bold hover:bg-gray-50">H2</button>
                  <button type="button" onClick={() => insertTag('<h3>', '</h3>')} className="px-2 py-1 bg-white rounded border border-gray-200 font-bold hover:bg-gray-50">H3</button>
                  <button type="button" onClick={() => insertTag('<strong>', '</strong>')} className="px-2 py-1 bg-white rounded border border-gray-200 font-bold hover:bg-gray-50">Gras</button>
                  <button type="button" onClick={() => insertTag('<em>', '</em>')} className="px-2 py-1 bg-white rounded border border-gray-200 italic hover:bg-gray-50">Italique</button>
                  <button type="button" onClick={() => insertTag('<ul>\n  <li>', '</li>\n</ul>')} className="px-2 py-1 bg-white rounded border border-gray-200 hover:bg-gray-50">Liste</button>
                  <button type="button" onClick={() => insertTag('<a href="#">', '</a>')} className="px-2 py-1 bg-white rounded border border-gray-200 hover:bg-gray-50">Lien</button>
                  <button type="button" onClick={() => insertTag('<div class="p-4 bg-purple-50 rounded-2xl border border-purple-200">', '</div>')} className="px-2 py-1 bg-white rounded border border-gray-200 text-purple-700 font-bold hover:bg-gray-50">Bloc Info</button>
                </div>
                <textarea
                  id="cms-content-editor"
                  rows={14}
                  value={pageForm.content}
                  onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 font-mono text-xs focus:outline-none focus:bg-white focus:border-purple-600"
                />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-2xl p-6 max-h-[400px] overflow-y-auto bg-slate-50 text-xs sm:text-sm text-gray-700 leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: pageForm.content }} />
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-150">
              <button
                type="button"
                onClick={() => setIsPageModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSavePage}
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-2xl shadow-md transition-all"
              >
                Enregistrer & Publier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIQUE DES VERSIONS & RESTAURATION */}
      {isVersionModalOpen && currentVersionPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div>
                <h3 className="font-black text-base text-gray-900">
                  Historique des versions : {currentVersionPage.title}
                </h3>
                <p className="text-xs text-gray-500">
                  Chaque modification crée une version. Vous pouvez restaurer un état précédent en un clic.
                </p>
              </div>
              <button
                onClick={() => setIsVersionModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            {versionsLoading ? (
              <div className="py-8 text-center text-xs text-gray-500">Chargement des versions...</div>
            ) : versions.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">Aucune version archivée.</div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 space-y-3">
                {versions.map((v) => (
                  <div key={v.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                          v{v.versionNumber}
                        </span>
                        <span className="font-bold text-xs text-gray-900">{v.title}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 italic">
                        {v.changeSummary || 'Modification standard'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(v.createdAt).toLocaleString('fr-FR')} par {v.createdByName || 'Admin'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRestoreVersion(v.versionNumber)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurer</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CRÉATION / MODIFICATION FAQ */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-black text-base text-gray-900">
              {editingFaqId ? 'Modifier la question FAQ' : 'Ajouter une question FAQ'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Catégorie</label>
                <select
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                >
                  <option value="Commandes">Commandes</option>
                  <option value="Paiement & Séquestre">Paiement & Séquestre</option>
                  <option value="Livraison">Livraison</option>
                  <option value="Litiges & Sécurité">Litiges & Sécurité</option>
                  <option value="Compte & Règles">Compte & Règles</option>
                  <option value="Général">Général</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Question *</label>
                <input
                  type="text"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  placeholder="Ex : Comment fonctionne le paiement sous séquestre ?"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Réponse détaillée *</label>
                <textarea
                  rows={4}
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  placeholder="Expliquez clairement la réponse..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={faqForm.sortOrder}
                    onChange={(e) => setFaqForm({ ...faqForm, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faqForm.isPublished}
                      onChange={(e) => setFaqForm({ ...faqForm, isPublished: e.target.checked })}
                      className="w-4 h-4 accent-purple-700"
                    />
                    <span className="font-bold text-gray-800">Publié sur le site</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-150">
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveFaq}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
