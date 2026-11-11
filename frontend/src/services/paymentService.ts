/**
 * Service de Paiement Mobile Money et Séquestre ReVibe FliP
 * 
 * Gère l'intégration des paiements sécurisés via Mobile Money (Wave, Orange Money, MTN MoMo, Moov) :
 *  * - Initialisation du paiement sous séquestre bancaire ReVibe Shield
 *  * - Vérification du statut de la transaction et confirmation de capture des fonds
 *  * - Déblocage et versement des gains sur le portefeuille du vendeur après livraison conforme
 */

import api from './httpClient';
import { Payment } from '../types';

/**
 * Service de traitement des transactions Mobile Money (Wave, Orange Money, Free Money) sous séquestre.
 */
export const paymentApi = {
  process: (data: { orderId: number; paymentMethod: string; phoneNumber: string }) =>
    api.post<{ success: boolean; data: Payment }>('/payments/process', data),
  getByOrder: (orderId: number) =>
    api.get<{ success: boolean; data: Payment }>(`/payments/order/${orderId}`),
};
