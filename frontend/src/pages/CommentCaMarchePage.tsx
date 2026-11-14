/**
 * Page Explicative 'Comment ça Marche' ReVibe FliP
 * 
 * Guide pédagogique illustré expliquant le fonctionnement de la marketplace :
 *  * - Étapes pour acheter en toute sécurité avec le séquestre ReVibe Shield
 *  * - Étapes pour vendre, expédier et recevoir ses gains Mobile Money instantanément
 *  * - Foire aux questions rapides pour rassurer les nouveaux utilisateurs
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contentApi } from '../services/api';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { CmsPage } from '../types';
import {
  Search,
  MessageSquare,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Star,
  Store,
  Camera,
  Coins,
  PackageCheck,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';

export const CommentCaMarchePage: React.FC = () => {
  const [pageData, setPageData] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi.getPage('comment-ca-marche')
      .then((res) => {
        if (res.data?.data) {
          setPageData(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Page dynamique introuvable, utilisation du fallback statique:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* HERO SECTION */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
            <span>Guide & Parcours ReVibe FliP</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
            Comment fonctionne ReVibe FliP ?
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            La marketplace sénégalaise de seconde main dédiée à la mode et aux articles du quotidien. 
            Découvrez comment acheter et vendre en toute simplicité et sécurité grâce à notre système de discussion préalable et de séquestre financier.
          </p>
        </div>

        {/* CONTENU CMS DYNAMIQUE S'IL A ÉTÉ PERSONNALISÉ PAR L'ADMIN */}
        {pageData && pageData.content && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-150 shadow-xs prose max-w-none text-sm text-gray-700">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(pageData.content) }} />
          </div>
        )}

        {/* PARCOURS ACHETEUR DÉTAILLÉ */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-150 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Guide Acheteur</span>
              <h2 className="text-2xl font-black text-gray-900 mt-1">Acheter en 6 étapes sereines</h2>
            </div>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-700/20 transition-all self-start sm:self-center"
            >
              <span>Explorer le catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Étape 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 relative">
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center">1</span>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-600" />
                <span>Trouvez votre article</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Recherchez par catégorie, quartier de Dakar, taille ou fourchette de prix. Chaque article est un modèle unique de seconde main.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 relative">
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center">2</span>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span>Discutez avant de payer</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Posez vos questions au vendeur : demandez des photos de détail, les mesures exactes ou convenez du quartier de remise.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 relative">
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center">3</span>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Recevez une offre directe</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Le vendeur formalise votre accord dans le chat via une offre sécurisée mentionnant le prix convenu et le mode de livraison.
              </p>
            </div>

            {/* Étape 4 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 relative">
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center">4</span>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Paiement sous séquestre</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Réglez via Wave, Orange Money ou Free Money. Vos fonds restent cantonnés par la plateforme et ne sont pas remis au vendeur.
              </p>
            </div>

            {/* Étape 5 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 relative">
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center">5</span>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600" />
                <span>Livraison & Suivi en direct</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Suivez votre coursier en temps réel avec le numéro de suivi direct généré (ex: TRK-DKR-XXXXX).
              </p>
            </div>

            {/* Étape 6 */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-3 relative">
              <span className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-800 font-black text-sm flex items-center justify-center">6</span>
              <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Validation & Déblocage</span>
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Une fois l'article entre vos mains et conforme, confirmez la réception en un clic pour libérer les fonds du vendeur et le noter !
              </p>
            </div>
          </div>
        </div>

        {/* PARCOURS VENDEUR DÉTAILLÉ */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-150 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Guide Vendeur</span>
              <h2 className="text-2xl font-black text-gray-900 mt-1">Vendre & Monétiser son dressing</h2>
            </div>
            <Link
              to="/sell"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all self-start sm:self-center"
            >
              <Store className="w-4 h-4" />
              <span>Publier mon premier article</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <Camera className="w-6 h-6 text-purple-700" />
              <h3 className="font-bold text-sm text-gray-900">1. Prenez de belles photos</h3>
              <p className="text-xs text-gray-600">
                Photographiez l'article à la lumière naturelle. Plus vos détails et mesures sont précis, moins vous aurez de questions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <MessageSquare className="w-6 h-6 text-purple-700" />
              <h3 className="font-bold text-sm text-gray-900">2. Échangez avec vos acheteurs</h3>
              <p className="text-xs text-gray-600">
                Recevez les questions dans votre messagerie dédiée et formulez vos offres directes en 1 clic.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <PackageCheck className="w-6 h-6 text-purple-700" />
              <h3 className="font-bold text-sm text-gray-900">3. Confirmez & Expédiez</h3>
              <p className="text-xs text-gray-600">
                Dès la notification d'achat reçu sous séquestre, préparez le paquet et remettez-le au coursier ou à l'acheteur.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-3">
              <Coins className="w-6 h-6 text-emerald-700" />
              <h3 className="font-bold text-sm text-emerald-950">4. Recevez vos gains</h3>
              <p className="text-xs text-emerald-800">
                Dès que l'acheteur confirme la conformité, votre solde net est crédité et transférable vers votre Mobile Money.
              </p>
            </div>
          </div>

          {/* DÉTAIL DE LA COMMISSION VENDEUR */}
          <div className="p-6 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-2">
            <h4 className="font-black text-sm text-purple-950 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-700" />
              <span>Transparence : Notre commission vendeur de 20 %</span>
            </h4>
            <p className="leading-relaxed">
              La création d'annonces est 100 % gratuite. Lorsque votre article est vendu et que l'acheteur valide sa conformité, une commission de 20 % est retenue sur le prix de l'article pour couvrir l'assurance acheteur, le fonctionnement de l'infrastructure de séquestre et le support client local.
            </p>
          </div>
        </div>

        {/* FAQ RAPIDE */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-500 mb-3">Vous avez d'autres questions sur le déroulement ?</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-50 transition-colors shadow-2xs"
            >
              <span>Consulter la FAQ complète</span>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition-colors shadow-xs"
            >
              <span>Contacter le support</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
