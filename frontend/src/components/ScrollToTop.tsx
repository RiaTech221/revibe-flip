/**
 * Gestionnaire de Défilement Automatique Vers le Haut ReVibe FliP
 * 
 * Composant utilitaire qui repositionne le scroll en haut de la page lors d'un changement d'URL.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
};
