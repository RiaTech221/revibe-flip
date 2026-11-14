/**
 * Page de Messagerie Instantanée et Négociations ReVibe FliP
 * 
 * Espace de discussion sécurisé entre acheteurs et vendeurs :
 *  * - Barre latérale des conversations avec badge des messages non lus
 *  * - Fenêtre de chat en temps réel avec cartes interactives d'offres de prix
 *  * - Bouton de retour direct vers le tableau de bord vendeur pour une navigation fluide
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { chatApi, chatOfferApi, paymentApi, uploadApi } from '../services/api';
import { Conversation, Message, ChatOffer, DeliveryMode, PaymentMethod } from '../types';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import { ConversationSidebar } from '../components/messages/ConversationSidebar';
import { ChatHeader } from '../components/messages/ChatHeader';
import { ChatOfferCard } from '../components/messages/ChatOfferCard';
import { ChatMessageItem } from '../components/messages/ChatMessageItem';
import { ChatInputBar } from '../components/messages/ChatInputBar';
import { MakeOfferModal } from '../components/messages/MakeOfferModal';
import { OfferPaymentModal } from '../components/messages/OfferPaymentModal';

export const MessagesPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Offres dans la conversation
  const [conversationOffers, setConversationOffers] = useState<ChatOffer[]>([]);
  const [isMakeOfferModalOpen, setIsMakeOfferModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [acceptedOfferToPay, setAcceptedOfferToPay] = useState<ChatOffer | null>(null);

  // Formulaire "Faire une offre"
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [offerDeliveryMode, setOfferDeliveryMode] = useState<DeliveryMode>('HOME_DELIVERY');
  const [offerDeliveryFee, setOfferDeliveryFee] = useState<number>(2000);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  // Formulaire "Paiement Séquestre"
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('WAVE');
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || '');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSeller = activeConversation?.seller?.id === user?.id;
  const isBuyer = activeConversation?.buyer?.id === user?.id;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const fetchConversations = async (targetId?: number) => {
    try {
      setLoading(true);
      const res = await chatApi.getConversations();
      const list = res?.data?.data || [];
      setConversations(list);
      if (list.length > 0) {
        const selected = targetId ? list.find((c: Conversation) => c.id === targetId) || list[0] : list[0];
        setActiveConversation(selected);
      } else {
        setActiveConversation(null);
      }
    } catch {
      setConversations([]);
      setActiveConversation(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await chatApi.getMessages(convId);
      setMessages(res?.data?.data || []);
    } catch {
      setMessages([]);
    }
  };

  const fetchOffers = async (convId: number) => {
    try {
      const res = await chatOfferApi.getConversationOffers(convId);
      setConversationOffers(res?.data?.data || []);
    } catch {
      setConversationOffers([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const targetId = searchParams.get('id');
      const convId = targetId ? parseInt(targetId, 10) : undefined;
      fetchConversations(convId);
    }
  }, [isAuthenticated, searchParams]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      fetchOffers(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, conversationOffers]);

  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const content = (customContent || newMessage).trim();
    if (!content || !activeConversation) return;

    try {
      setSending(true);
      const res = await chatApi.sendMessage({ conversationId: activeConversation.id, content });
      if (res?.data?.data) {
        setMessages(prev => [...prev, res.data.data]);
      }
      if (!customContent) setNewMessage('');
      fetchConversations(activeConversation.id);
    } catch {
      const localMsg: Message = {
        id: Date.now(),
        conversationId: activeConversation.id,
        senderId: user?.id || 0,
        senderName: user?.fullName || 'Moi',
        content,
        sentAt: new Date().toISOString(),
        isRead: false,
      };
      setMessages(prev => [...prev, localMsg]);
      if (!customContent) setNewMessage('');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;
    try {
      setUploadingImage(true);
      const res = await uploadApi.uploadFile(file);
      const imageUrl = res?.data?.data || '';
      await chatApi.sendMessage({
        conversationId: activeConversation.id,
        content: "Photo détaillée envoyée",
        imageUrl,
      });
      fetchMessages(activeConversation.id);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'envoi de l'image.");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleOpenMakeOffer = () => {
    if (!activeConversation) return;
    const initialPrice = activeConversation.productId
      ? CURATED_PRODUCTS.find(p => p.id === activeConversation.productId)?.price || 15000
      : 15000;
    setOfferPrice(initialPrice);
    setOfferDeliveryMode('HOME_DELIVERY');
    setOfferDeliveryFee(2000);
    setOfferError(null);
    setIsMakeOfferModalOpen(true);
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !offerPrice) return;
    setOfferSubmitting(true);
    setOfferError(null);
    try {
      await chatOfferApi.createOffer({
        conversationId: activeConversation.id,
        productId: activeConversation.productId || 1,
        agreedPrice: Number(offerPrice),
        deliveryMode: offerDeliveryMode,
        deliveryFee: offerDeliveryMode === 'HOME_DELIVERY' ? offerDeliveryFee : 0,
        validityHours: 24,
      });
      setIsMakeOfferModalOpen(false);
      fetchOffers(activeConversation.id);
      fetchMessages(activeConversation.id);
    } catch (err: any) {
      setOfferError(err.response?.data?.message || "Échec de l'envoi de l'offre.");
    } finally {
      setOfferSubmitting(false);
    }
  };

  const handleAcceptOffer = async (offer: ChatOffer) => {
    if (!confirm(`Accepter l'offre à ${formatPrice(offer.agreedPrice)} ?`)) return;
    try {
      const res = await chatOfferApi.acceptOffer(offer.id);
      if (activeConversation) {
        fetchOffers(activeConversation.id);
        fetchMessages(activeConversation.id);
      }
      if (res?.data?.data) {
        setAcceptedOfferToPay(res.data.data);
      }
      setIsPaymentModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'acceptation.");
    }
  };

  const handleDeclineOffer = async (offerId: number) => {
    if (!confirm("Refuser cette offre de prix ?")) return;
    try {
      await chatOfferApi.declineOffer(offerId);
      if (activeConversation) {
        fetchOffers(activeConversation.id);
        fetchMessages(activeConversation.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors du refus de l'offre.");
    }
  };

  const handleCancelOffer = async (offerId: number) => {
    if (!confirm("Annuler votre offre envoyée ?")) return;
    try {
      await chatOfferApi.cancelOffer(offerId);
      if (activeConversation) {
        fetchOffers(activeConversation.id);
        fetchMessages(activeConversation.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'annulation.");
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedOfferToPay || !acceptedOfferToPay.orderId) return;
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const payRes = await paymentApi.initiate({
        orderId: acceptedOfferToPay.orderId,
        paymentMethod,
        phoneNumber: paymentPhone || user?.phone || '',
      });
      const redirectUrl = payRes.data?.data?.redirectUrl;
      if (redirectUrl && redirectUrl.startsWith('https://')) {
        window.location.href = redirectUrl;
        return;
      }
      setPaymentError("Lien de paiement PayTech indisponible.");
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || "Échec de l'initialisation du paiement.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const latestOffer = conversationOffers.length > 0 ? conversationOffers[0] : null;

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <MessageSquare className="w-12 h-12 text-purple-700 mx-auto mb-3" />
        <h2 className="text-base font-bold text-gray-900">Connectez-vous pour voir vos messages</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* BARRE DE RETOUR DASHBOARD / ACCUEIL */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/seller?tab=overview"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/80 font-bold text-xs shadow-2xs transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Retour au Tableau de bord vendeur</span>
        </Link>
        <Link
          to="/"
          className="text-xs text-slate-500 hover:text-purple-700 font-medium transition-colors"
        >
          Accueil ReVibe FliP
        </Link>
      </div>

      {/* BANNIÈRE DE PRÉVENTION */}
      <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-purple-50 border border-purple-200/80 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-purple-950 font-medium">
          <div className="w-7 h-7 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span>
            <strong>Sécurité ReVibe FliP :</strong> Ne payez jamais en dehors de l'application. Vos fonds sont protégés par le séquestre officiel.
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-white px-2.5 py-1 rounded-full border border-purple-150">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
          Séquestre Garanti
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px] max-h-[800px]">
        {/* LISTE DES CONVERSATIONS (4 cols) */}
        <ConversationSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
          onRefresh={() => fetchConversations(activeConversation?.id)}
          loading={loading}
          currentUser={user}
        />

        {/* DISCUSSION ACTIVE (8 cols) */}
        <div className="md:col-span-8 flex flex-col bg-gray-50/40">
          {activeConversation ? (
            <>
              <ChatHeader
                activeConversation={activeConversation}
                currentUser={user}
                latestOffer={latestOffer}
                onOpenMakeOffer={handleOpenMakeOffer}
                onOpenPaymentModal={(offer) => {
                  setAcceptedOfferToPay(offer);
                  setIsPaymentModalOpen(true);
                }}
                formatPrice={formatPrice}
              />

              {/* MESSAGES & OFFRES */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {conversationOffers.map((offer) => (
                  <ChatOfferCard
                    key={`offer-${offer.id}`}
                    offer={offer}
                    isBuyer={isBuyer}
                    isSeller={isSeller}
                    onAccept={handleAcceptOffer}
                    onDecline={handleDeclineOffer}
                    onCancel={handleCancelOffer}
                    onPay={(off) => {
                      setAcceptedOfferToPay(off);
                      setIsPaymentModalOpen(true);
                    }}
                    formatPrice={formatPrice}
                  />
                ))}

                {messages.length === 0 && conversationOffers.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400">
                    Envoyez un premier message pour démarrer la négociation.
                  </div>
                ) : (
                  messages.map((m) => (
                    <ChatMessageItem key={m.id} message={m} currentUserId={user?.id} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <ChatInputBar
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={handleSendMessage}
                onImageUpload={handleImageUpload}
                sending={sending}
                uploadingImage={uploadingImage}
                isBuyer={isBuyer}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <MessageSquare className="w-16 h-16 text-gray-200 mb-3" />
              <p className="text-sm font-bold text-gray-700">Sélectionnez une discussion</p>
              <p className="text-xs text-gray-400 mt-1">Discutez avec vos acheteurs et vendeurs avant tout paiement sous séquestre.</p>
            </div>
          )}
        </div>
      </div>

      <MakeOfferModal
        isOpen={isMakeOfferModalOpen}
        onClose={() => setIsMakeOfferModalOpen(false)}
        onSubmit={handleSubmitOffer}
        offerPrice={offerPrice}
        setOfferPrice={setOfferPrice}
        offerDeliveryMode={offerDeliveryMode}
        setOfferDeliveryMode={setOfferDeliveryMode}
        offerDeliveryFee={offerDeliveryFee}
        setOfferDeliveryFee={setOfferDeliveryFee}
        offerError={offerError}
        offerSubmitting={offerSubmitting}
      />

      <OfferPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentSuccess(false);
          setAcceptedOfferToPay(null);
        }}
        offer={acceptedOfferToPay}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentPhone={paymentPhone}
        setPaymentPhone={setPaymentPhone}
        paymentLoading={paymentLoading}
        paymentSuccess={paymentSuccess}
        paymentError={paymentError}
        onSubmit={handleProcessPayment}
        formatPrice={formatPrice}
      />
    </div>
  );
};
