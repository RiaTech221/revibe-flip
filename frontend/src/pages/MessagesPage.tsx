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
import { createStompClient } from '../services/wsClient';
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
import { ConfirmModal } from '../components/common/ConfirmModal';

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
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const isSeller = activeConversation?.seller?.id === user?.id;
  const isBuyer = activeConversation?.buyer?.id === user?.id;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const fetchConversations = async (targetId?: number, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await chatApi.getConversations();
      const list = res?.data?.data || [];
      setConversations(list);
      if (!silent) {
        if (list.length > 0) {
          const selected = targetId ? list.find((c: Conversation) => c.id === targetId) || list[0] : list[0];
          setActiveConversation(selected);
        } else {
          setActiveConversation(null);
        }
      }
    } catch {
      if (!silent) {
        setConversations([]);
        setActiveConversation(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await chatApi.getMessages(convId);
      setMessages(res?.data?.data || []);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
      window.dispatchEvent(new CustomEvent('revibe:messages-read'));
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
      const targetId = searchParams.get('id') || searchParams.get('conversation');
      const convId = targetId ? parseInt(targetId, 10) : undefined;
      if (convId) setMobileShowChat(true);
      fetchConversations(convId);
    }
  }, [isAuthenticated, searchParams]);

  useEffect(() => {
    if (!activeConversation) return;
    const convId = activeConversation.id;
    fetchMessages(convId);
    fetchOffers(convId);

    const client = createStompClient((stomp) => {
      stomp.subscribe(`/topic/conversations/${convId}`, (frame) => {
        try {
          const incoming: Message = JSON.parse(frame.body);
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
          if (incoming.senderId !== user?.id) {
            chatApi.markAsRead(convId).then(() => {
              window.dispatchEvent(new CustomEvent('revibe:messages-read'));
            }).catch(() => {});
          }
        } catch {
          // ignore parse error
        }
      });

      stomp.subscribe(`/topic/conversations/${convId}/read`, (frame) => {
        try {
          const payload = JSON.parse(frame.body) as { conversationId: number; readerId: number };
          if (payload.readerId !== user?.id) {
            setMessages((prev) =>
              prev.map((m) => (m.senderId === user?.id ? { ...m, isRead: true } : m))
            );
          }
        } catch {
          // ignore parse error
        }
      });
    });

    return () => {
      client?.deactivate();
    };
  }, [activeConversation?.id, user?.id]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
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
      fetchConversations(activeConversation.id, true);
    } catch {
      alert("Impossible d'envoyer le message pour le moment. Veuillez réessayer.");
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
    const initialPrice = Number(activeConversation.productPrice) || 15000;
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

  const handleAcceptOffer = (offer: ChatOffer) => {
    setConfirmDialog({
      title: "Accepter cette offre ?",
      message: `Voulez-vous accepter l'offre de prix à ${formatPrice(offer.agreedPrice)} ? Vous pourrez ensuite procéder au paiement sécurisé.`,
      confirmLabel: "Accepter l'offre",
      variant: 'primary',
      onConfirm: async () => {
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
      },
    });
  };

  const handleDeclineOffer = (offerId: number) => {
    setConfirmDialog({
      title: 'Refuser cette offre ?',
      message: "L'acheteur sera informé que vous avez décliné sa proposition de prix.",
      confirmLabel: 'Refuser',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await chatOfferApi.declineOffer(offerId);
          if (activeConversation) {
            fetchOffers(activeConversation.id);
            fetchMessages(activeConversation.id);
          }
        } catch (err: any) {
          alert(err.response?.data?.message || "Erreur lors du refus de l'offre.");
        }
      },
    });
  };

  const handleCancelOffer = (offerId: number) => {
    setConfirmDialog({
      title: 'Annuler votre offre ?',
      message: 'Cette offre de prix sera annulée et ne pourra plus être acceptée par le vendeur.',
      confirmLabel: "Annuler l'offre",
      variant: 'danger',
      onConfirm: async () => {
        try {
          await chatOfferApi.cancelOffer(offerId);
          if (activeConversation) {
            fetchOffers(activeConversation.id);
            fetchMessages(activeConversation.id);
          }
        } catch (err: any) {
          alert(err.response?.data?.message || "Erreur lors de l'annulation.");
        }
      },
    });
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

      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100dvh-140px)] min-h-[500px] md:h-[700px] md:max-h-[800px]">
        {/* LISTE DES CONVERSATIONS (4 cols) */}
        <ConversationSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={(conv) => {
            setActiveConversation(conv);
            setMobileShowChat(true);
          }}
          onRefresh={() => fetchConversations(activeConversation?.id, true)}
          loading={loading}
          currentUser={user}
          className={mobileShowChat ? 'hidden md:flex' : 'flex'}
        />

        {/* DISCUSSION ACTIVE (8 cols) */}
        <div className={`${mobileShowChat ? 'flex' : 'hidden md:flex'} md:col-span-8 flex-col bg-gray-50/40 min-h-0`}>
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
                onBackMobile={() => setMobileShowChat(false)}
              />

              {/* MESSAGES & OFFRES */}
              <div ref={messagesContainerRef} className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto space-y-4">
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

      <ConfirmModal
        isOpen={!!confirmDialog}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        loading={confirmLoading}
        onCancel={() => {
          if (!confirmLoading) setConfirmDialog(null);
        }}
        onConfirm={async () => {
          if (!confirmDialog) return;
          setConfirmLoading(true);
          try {
            await confirmDialog.onConfirm();
          } finally {
            setConfirmLoading(false);
            setConfirmDialog(null);
          }
        }}
      />
    </div>
  );
};
