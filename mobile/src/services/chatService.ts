import api from '../api';
import { Conversation, Message, ChatOffer } from '../types';

export const chatService = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get('/messages/conversations');
    return res.data?.data || [];
  },

  getOrCreateConversation: async (productId: number): Promise<Conversation> => {
    const res = await api.post('/messages/conversations', { productId });
    return res.data?.data;
  },

  getMessages: async (conversationId: number): Promise<Message[]> => {
    const res = await api.get(`/messages/conversations/${conversationId}`);
    return res.data?.data || [];
  },

  sendMessage: async (conversationId: number, content: string): Promise<Message> => {
    const res = await api.post('/messages/send', { conversationId, content });
    return res.data?.data;
  },

  getOffers: async (conversationId: number): Promise<ChatOffer[]> => {
    const res = await api.get(`/chat-offers/conversation/${conversationId}`);
    return res.data?.data || [];
  },

  createOffer: async (data: {
    conversationId: number;
    productId: number;
    agreedPrice: number;
    deliveryMode?: string;
    deliveryFee?: number;
    validityHours?: number;
  }): Promise<ChatOffer> => {
    const res = await api.post('/chat-offers', {
      deliveryMode: 'MOTO_DAKAR',
      deliveryFee: 1500,
      validityHours: 24,
      ...data,
    });
    return res.data?.data;
  },

  acceptOffer: async (offerId: number): Promise<ChatOffer> => {
    const res = await api.post(`/chat-offers/${offerId}/accept`);
    return res.data?.data;
  },

  rejectOffer: async (offerId: number): Promise<ChatOffer> => {
    const res = await api.post(`/chat-offers/${offerId}/decline`);
    return res.data?.data;
  },
};

export default chatService;
