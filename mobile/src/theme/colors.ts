/**
 * Charte Graphique et Utilitaires Stylistiques Mobile ReVibe FliP
 * 
 * Définit les constantes visuelles et helpers de formatage de l'application mobile :
 *  * - Palette ReVibe FliP : violet primaire, dégradés, vert séquestre, rouge litige, gris neutres
 *  * - Fonction formatPrice : formate les montants monétaires en FCFA avec séparateur de milliers
 */

export const colors = {
  primary: '#7e22ce', // Mauve ReVibe principal
  primaryDark: '#581c87',
  primaryLight: '#f3e8ff',
  primaryAccent: '#9333ea',
  secondary: '#ec4899', // Rose/Magenta accent
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  success: '#10b981',
  successLight: '#ecfdf5',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  white: '#ffffff',
  black: '#000000',
  shadow: 'rgba(0, 0, 0, 0.05)',
};

export const formatPrice = (price?: number | null) => {
  if (price === undefined || price === null) return '0 FCFA';
  return Math.round(price).toLocaleString('fr-FR') + ' FCFA';
};
