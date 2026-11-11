/**
 * Bandeau d'Annonces Global ReVibe FliP
 * 
 * Affiche un ruban supérieur d'information générale :
 *  * - Alertes promotionnelles, informations sur le séquestre ou maintenance
 *  * - Option de fermeture persistante pour la session utilisateur
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contentApi } from '../services/api';
import { AnnouncementBanner as AnnouncementType } from '../types';
import { Sparkles, X, ArrowRight } from 'lucide-react';

export const AnnouncementBanner: React.FC = () => {
  const [banner, setBanner] = useState<AnnouncementType | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('revibe_announcement_dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    contentApi.getAnnouncement()
      .then((res) => {
        if (res.data?.data && res.data.data.isCurrentlyActive) {
          setBanner(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Bandeau annonce indisponible:', err.message);
      });
  }, []);

  if (!banner || !banner.isCurrentlyActive || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('revibe_announcement_dismissed', 'true');
  };

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white text-xs py-2 px-4 shadow-sm border-b border-purple-800/50 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 justify-center text-center">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden sm:inline" />
          <span className="font-semibold text-purple-100">{banner.message}</span>
          {banner.link && (
            <Link
              to={banner.link}
              className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 underline ml-1.5 transition-colors"
            >
              <span>En savoir plus</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-full text-purple-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="Fermer le message"
          aria-label="Fermer le bandeau"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
