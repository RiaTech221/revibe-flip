/**
 * Service de Messagerie et Négociation d'Offres ReVibe FliP
 * 
 * Gère les communications directes acheteur-vendeur et le protocole de négociation :
 *  * - Récupération des conversations et messages en temps réel
 *  * - Envoi de messages texte et propositions d'offres directes de prix
 *  * - Acceptation, rejet et paiement d'une offre sous protection séquestre
 */

import api from './httpClient';
import { Conversation, Message, ChatOffer } from '../types';

/**
 * Service de messagerie instantanée contextuelle et négociation d'offres de prix.
 */
export const chatApi = {
  getConversations: () =>
    api.get<{ success: boolean; data: Conversation[] }>('/messages/conversations'),
  getMessages: (conversationId: number) =>
    api.get<{ success: boolean; data: Message[] }>(`/messages/conversations/${conversationId}`),
  startConversation: (data: { productId?: number; productIds?: number[]; initialMessage?: string }) =>
    api.post<{ success: boolean; data: Conversation }>('/messages/conversations', data),
  sendMessage: (data: { conversationId: number; content?: string; imageUrl?: string }) =>
    api.post<{ success: boolean; data: Message }>('/messages/send', data),
};

export const chatOfferApi = {
  createOffer: (data: {
    conversationId: number;
    productId: number;
    agreedPrice: number;
    deliveryMode: string;
    deliveryFee?: number;
    validityHours?: number;
  }) => api.post<{ success: boolean; data: ChatOffer }>('/chat-offers', data),
  acceptOffer: (id: number) =>
    api.post<{ success: boolean; data: ChatOffer }>(`/chat-offers/${id}/accept`),
  declineOffer: (id: number) =>
    api.post<{ success: boolean; data: ChatOffer }>(`/chat-offers/${id}/decline`),
  cancelOffer: (id: number) =>
    api.post<{ success: boolean; data: ChatOffer }>(`/chat-offers/${id}/cancel`),
  getConversationOffers: (conversationId: number) =>
    api.get<{ success: boolean; data: ChatOffer[] }>(`/chat-offers/conversation/${conversationId}`),
  getSellerOffers: () =>
    api.get<{ success: boolean; data: ChatOffer[] }>('/chat-offers/seller'),
};
