import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { contentApi } from '../services/api';
import { CmsPage } from '../types';
import {
  FileText,
  Clock,
  Download,
  AlertCircle,
  ChevronLeft,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface CmsPageViewProps {
  fixedSlug?: string;
}

export const CmsPageView: React.FC<CmsPageViewProps> = ({ fixedSlug }) => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();

  // Déterminer le slug réel (soit fixé via la route '/cgu', soit paramètre '/p/:slug')
  const actualSlug =
    fixedSlug ||
    slug ||
    location.pathname.replace(/^\//, '').split('/')[0] ||
    'cgu';

  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    contentApi.getPage(actualSlug)
      .then((res) => {
        if (res.data?.data) {
          setPage(res.data.data);
        } else {
          setError('Page introuvable.');
        }
      })
      .catch((err) => {
        console.error('Erreur chargement page CMS:', err);
        setError(err.response?.data?.message || 'Page introuvable.');
      })
      .finally(() => setLoading(false));
  }, [actualSlug]);

  const isDevProfile =
    (import.meta as any).env?.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500">Chargement de la page...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-gray-900">Page introuvable</h2>
        <p className="text-xs text-gray-500">
          Le document demandé n'existe pas ou est actuellement en cours de rédaction.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* CARTE PRINCIPALE DE CONTENU */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-150 shadow-xs space-y-6">

          {/* En-tête */}
          <div className="pb-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-purple-700 font-bold mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider">Document Officiel</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {page.title}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Dernière mise à jour :{' '}
                  {new Date(page.updatedAt || page.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                {page.currentVersion && (
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold">
                    v{page.currentVersion}
                  </span>
                )}
              </div>
            </div>

            {/* Bouton de téléchargement PDF si configuré */}
            {page.pdfUrl && (
              <a
                href={page.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition-colors self-start sm:self-center"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger la version PDF</span>
              </a>
            )}
          </div>

          {/* Contenu Rich Text nettoyé et stylé */}
          <div
            className="cms-content text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {/* Pied de page du document */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Document certifié ReVibe FliP</span>
            </div>
            <Link to="/" className="text-purple-700 hover:underline font-bold">
              Retour à la vitrine d'accueil &rarr;
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
