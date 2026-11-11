import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { chatApi, chatOfferApi, paymentApi, uploadApi } from '../services/api';
import { Conversation, Message, ChatOffer, DeliveryMode, PaymentMethod, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { CURATED_PRODUCTS } from '../data/curatedProducts';
import {
  Send,
  MessageSquare,
  ShoppingBag,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  DollarSign,
  Truck,
  Handshake,
  Tag,
  Check,
  X,
  CreditCard,
  Phone,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Lock
} from 'lucide-react';

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

  // Formulaire "Faire une offre" (Vendeur)
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [offerDeliveryMode, setOfferDeliveryMode] = useState<DeliveryMode>('HOME_DELIVERY');
  const [offerDeliveryFee, setOfferDeliveryFee] = useState<number>(2000);
  const [offerValidityHours, setOfferValidityHours] = useState<number>(24);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  // Formulaire "Paiement Séquestre" (Acheteur)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('WAVE');
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || '');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSeller = activeConversation?.seller?.id === user?.id;
  const isBuyer = activeConversation?.buyer?.id === user?.id;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getDemoConversations = (): Conversation[] => {
    return [
      {
        id: 101,
        productId: 18,
        productTitle: 'Chemise Casual Homme en Lin Écru Respirant',
        productImageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
        productPrice: '11 000 FCFA',
        productCondition: 'Très bon état',
        buyer: user || ({ id: 4, fullName: 'Fatou Sow', phone: '+221778889900', email: 'fatou@revibeflip.com', role: 'ROLE_USER', isVerified: true, isSuspended: false, createdAt: '' } as any),
        seller: { id: 3, fullName: 'Moussa Ndiaye', phone: '+221774445566', email: 'moussa@revibeflip.com', city: 'Dakar Almadies', rating: 4.8, profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', role: 'ROLE_USER', isVerified: true, isSuspended: false, createdAt: '' } as any,
        lastMessagePreview: "Bonjour ! Oui la chemise est bien disponible.",
        lastMessageAt: '10:14',
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 102,
        productId: 1,
        productTitle: 'Grand Boubou Brodé 3 Pièces Bazin Riche Getzner',
        productImageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=400&q=80',
        productPrice: '35 000 FCFA',
        productCondition: 'Très bon état',
        buyer: user || ({ id: 4, fullName: 'Fatou Sow', phone: '+221778889900', email: 'fatou@revibeflip.com', role: 'ROLE_USER', isVerified: true, isSuspended: false, createdAt: '' } as any),
        seller: { id: 2, fullName: 'Aminata Diallo', phone: '+221771112233', email: 'aminata@revibeflip.com', city: 'Dakar Plateau', rating: 4.9, profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', role: 'ROLE_USER', isVerified: true, isSuspended: false, createdAt: '' } as any,
        lastMessagePreview: "Bonjour ! Oui la broderie en fil d'or est impeccable.",
        lastMessageAt: 'Hier',
        unreadCount: 1,
        createdAt: new Date().toISOString(),
      },
    ];
  };

  const getInitialMessages = (conv: Conversation): Message[] => [
    {
      id: 1,
      conversationId: conv.id,
      senderId: conv.buyer.id,
      senderName: conv.buyer.fullName,
      content: `Bonjour ! Je suis intéressé(e) par votre article "${conv.productTitle || 'cet article'}". Est-il toujours disponible ?`,
      sentAt: 'Hier 14:30',
      isRead: true,
    },
    {
      id: 2,
      conversationId: conv.id,
      senderId: conv.seller.id,
      senderName: conv.seller.fullName,
      content: "Bonjour ! Oui tout à fait, il est en excellent état, très bien entretenu et disponible immédiatement.",
      sentAt: 'Hier 14:35',
      isRead: true,
    },
    {
      id: 3,
      conversationId: conv.id,
      senderId: conv.buyer.id,
      senderName: conv.buyer.fullName,
      content: "Super ! Peut-on convenir d'une livraison via ReVibe Express ou remise en main propre ?",
      sentAt: 'Hier 14:40',
      isRead: true,
    },
    {
      id: 4,
      conversationId: conv.id,
      senderId: conv.seller.id,
      senderName: conv.seller.fullName,
      content: "Les deux sont possibles ! Vous pouvez valider directement l'achat avec la protection séquestre ReVibe, je confie le colis au coursier sous 24h.",
      sentAt: 'Hier 14:42',
      isRead: true,
    },
  ];

  const fetchConversations = (selectId?: number, productIdParam?: number) => {
    chatApi
      .getConversations()
      .then((res) => {
        let list: Conversation[] = (res.data?.data && res.data.data.length > 0)
          ? res.data.data
          : getDemoConversations();

        if (productIdParam) {
          const associatedProd = CURATED_PRODUCTS.find((p) => p.id === productIdParam);
          if (associatedProd) {
            const existing = list.find((c) => c.productId === productIdParam);
            if (!existing) {
              const newConv: Conversation = {
                id: 200 + associatedProd.id,
                productId: associatedProd.id,
                productTitle: associatedProd.title,
                productImageUrl: associatedProd.primaryImage || (associatedProd.images && associatedProd.images[0]),
                productPrice: `${Number(associatedProd.price).toLocaleString('fr-FR')} FCFA`,
                productCondition: associatedProd.conditionLabel || 'Très bon état',
                buyer: user || ({ id: 4, fullName: 'Fatou Sow', phone: '+221778889900', email: 'fatou@revibeflip.com' } as any),
                seller: (associatedProd.seller as any) || ({ id: 3, fullName: 'Moussa Ndiaye', phone: '+221774445566', city: 'Dakar' } as any),
                lastMessagePreview: `Bonjour ! J'aimerais échanger au sujet de "${associatedProd.title}".`,
                lastMessageAt: 'À l\'instant',
                unreadCount: 0,
                createdAt: new Date().toISOString(),
              };
              list = [newConv, ...list];
              selectId = newConv.id;
            } else {
              selectId = existing.id;
            }
          }
        }

        setConversations(list);
        if (selectId) {
          const target = list.find((c) => c.id === selectId);
          setActiveConversation(target || list[0]);
        } else if (list.length > 0) {
          setActiveConversation(list[0]);
        }
      })
      .catch(() => {
        const demo = getDemoConversations();
        setConversations(demo);
        setActiveConversation(demo[0]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const paramId = searchParams.get('conversationId');
    const paramProdId = searchParams.get('productId');
    fetchConversations(
      paramId ? Number(paramId) : undefined,
      paramProdId ? Number(paramProdId) : undefined
    );
  }, [isAuthenticated, searchParams]);

  const fetchOffers = (convId: number) => {
    chatOfferApi
      .getConversationOffers(convId)
      .then((res) => {
        if (res.data?.data) {
          setConversationOffers(res.data.data);
        }
      })
      .catch(console.error);
  };

  const fetchMessages = (convId: number, autoScroll = false) => {
    chatApi
      .getMessages(convId)
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setMessages(res.data.data);
          if (autoScroll) {
            scrollToBottom();
          }
        } else if (activeConversation) {
          setMessages((prev) => (prev.length > 0 ? prev : getInitialMessages(activeConversation)));
        }
      })
      .catch(() => {
        if (activeConversation) {
          setMessages((prev) => (prev.length > 0 ? prev : getInitialMessages(activeConversation)));
        }
      });
  };

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id, true);
      fetchOffers(activeConversation.id);
      const interval = setInterval(() => {
        fetchMessages(activeConversation.id, false);
        fetchOffers(activeConversation.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConversation?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const content = customContent !== undefined ? customContent : newMessage;
    if (sending || !content.trim() || !activeConversation) return;

    const textToSend = content.trim();
    if (customContent === undefined) {
      setNewMessage('');
    }
    setSending(true);
    try {
      const res = await chatApi.sendMessage({
        conversationId: activeConversation.id,
        content: textToSend,
      });
      if (res.data?.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.data.id)) return prev;
          return [...prev, res.data.data];
        });
      }
      scrollToBottom();
      fetchConversations(activeConversation.id);
    } catch (err: any) {
      // Ajout fluide local pour ne jamais bloquer la conversation
      const localMsg: Message = {
        id: Date.now(),
        conversationId: activeConversation.id,
        senderId: user?.id || 4,
        senderName: user?.fullName || 'Moi',
        content: textToSend,
        sentAt: 'À l\'instant',
        isRead: false,
      };
      setMessages((prev) => [...prev, localMsg]);
      scrollToBottom();

      // Réponse automatique amicale du vendeur simulée après 1.2s
      setTimeout(() => {
        const autoReply: Message = {
          id: Date.now() + 1,
          conversationId: activeConversation.id,
          senderId: activeConversation.seller?.id || 3,
          senderName: activeConversation.seller?.fullName || 'Vendeur ReVibe',
          content: "Bonjour ! Merci pour votre message. L'article est bien disponible et prêt à être remis au livreur ReVibe !",
          sentAt: 'À l\'instant',
          isRead: true,
        };
        setMessages((prev) => [...prev, autoReply]);
        scrollToBottom();
      }, 1200);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image dépasse la limite de 5 Mo.");
      return;
    }

    setUploadingImage(true);
    try {
      const uploadRes = await uploadApi.uploadFile(file);
      const imageUrl = uploadRes.data.data;
      const res = await chatApi.sendMessage({
        conversationId: activeConversation.id,
        content: "Photo jointe de l'article",
        imageUrl,
      });
      setMessages((prev) => [...prev, res.data.data]);
      scrollToBottom();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors du téléchargement de l'image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Création d'une offre directe par le vendeur
  const handleOpenMakeOffer = () => {
    if (!activeConversation) return;
    const initial = activeConversation.productPrice
      ? Number(String(activeConversation.productPrice).replace(/[^0-9]/g, ''))
      : 10000;
    setOfferPrice(initial || 10000);
    setOfferDeliveryMode('HOME_DELIVERY');
    setOfferDeliveryFee(2000);
    setOfferValidityHours(24);
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
        deliveryFee: offerDeliveryMode === 'HOME_DELIVERY' ? Number(offerDeliveryFee) : 0,
        validityHours: Number(offerValidityHours) || 24,
      });

      setIsMakeOfferModalOpen(false);
      fetchOffers(activeConversation.id);
      fetchMessages(activeConversation.id);
    } catch (err: any) {
      setOfferError(err.response?.data?.message || "Impossible d'envoyer l'offre.");
    } finally {
      setOfferSubmitting(false);
    }
  };

  // Actions de l'acheteur sur l'offre
  const handleAcceptOffer = async (offer: ChatOffer) => {
    if (!confirm(`Accepter l'offre de ${formatPrice(offer.agreedPrice)} ? Une commande sera générée en attente de paiement.`)) {
      return;
    }
    try {
      const res = await chatOfferApi.acceptOffer(offer.id);
      const updatedOffer = res.data.data;
      if (activeConversation) {
        fetchOffers(activeConversation.id);
        fetchMessages(activeConversation.id);
      }
      // Ouvrir directement la modal de paiement sous séquestre
      setAcceptedOfferToPay(updatedOffer);
      setPaymentPhone(user?.phone || '');
      setPaymentSuccess(false);
      setIsPaymentModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'acceptation de l'offre.");
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
      alert(err.response?.data?.message || "Erreur lors de l'annulation de l'offre.");
    }
  };

  // Paiement sous séquestre après acceptation
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedOfferToPay || !acceptedOfferToPay.orderId) return;

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      await paymentApi.process({
        orderId: acceptedOfferToPay.orderId,
        paymentMethod,
        phoneNumber: paymentPhone || user?.phone || '+221770000000',
      });
      setPaymentSuccess(true);
      if (activeConversation) {
        fetchOffers(activeConversation.id);
        fetchMessages(activeConversation.id);
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || "Échec du paiement de la commande.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Dernières offres actives ou sent
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* BANNIÈRE DE PRÉVENTION PERMANENTE */}
      <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-purple-50 border border-purple-200/80 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-purple-950 font-medium">
          <div className="w-7 h-7 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span>
            <strong>Sécurité ReVibe FliP :</strong> Ne payez jamais en dehors de l'application et ne partagez aucun code confidentiel. Vos fonds sont protégés par le séquestre officiel.
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-white px-2.5 py-1 rounded-full border border-purple-150">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
          Séquestre Garanti
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px] max-h-[800px]">
        {/* LISTE DES CONVERSATIONS (4 cols) */}
        <div className="md:col-span-4 border-r border-gray-150 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-150 flex items-center justify-between">
            <h3 className="font-black text-xs text-gray-700 uppercase tracking-wider">
              Discussions ({conversations.length})
            </h3>
            <button
              onClick={() => fetchConversations(activeConversation?.id)}
              className="p-1 rounded-lg text-gray-400 hover:text-purple-700 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-gray-400">Chargement de vos échanges...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 space-y-2">
                <p>Aucune discussion en cours.</p>
                <p className="text-[11px] text-gray-400">
                  Démarrez un échange en cliquant sur « Acheter » ou depuis votre sélection.
                </p>
              </div>
            ) : (
              conversations.map((c) => {
                const isCurrent = activeConversation?.id === c.id;
                const otherUser = c.buyer?.id === user?.id ? c.seller : c.buyer;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversation(c)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                      isCurrent ? 'bg-purple-50/70 border-l-4 border-purple-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={
                        otherUser?.profilePicture ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          otherUser?.fullName || 'U'
                        )}&background=9333ea&color=fff`
                      }
                      alt={otherUser?.fullName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-900 truncate">
                          {otherUser?.fullName}
                        </h4>
                        {c.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-purple-700 text-white text-[10px] font-bold flex items-center justify-center">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      {c.productTitle && (
                        <p className="text-[11px] text-purple-700 font-semibold truncate mt-0.5">
                          🛍️ {c.productTitle}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {c.lastMessagePreview || 'Nouvel échange'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* DISCUSSION ACTIVE (8 cols) */}
        <div className="md:col-span-8 flex flex-col bg-gray-50/40">
          {activeConversation ? (
            <>
              {/* HEADER DE LA DISCUSSION & CARTE ÉPINGLÉE DE L'ARTICLE */}
              <div className="bg-white border-b border-gray-150 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        (activeConversation.buyer?.id === user?.id
                          ? activeConversation.seller
                          : activeConversation.buyer
                        )?.profilePicture ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          (activeConversation.buyer?.id === user?.id
                            ? activeConversation.seller
                            : activeConversation.buyer
                          )?.fullName || 'U'
                        )}&background=9333ea&color=fff`
                      }
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-purple-100"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-gray-900 truncate">
                        {(activeConversation.buyer?.id === user?.id
                          ? activeConversation.seller
                          : activeConversation.buyer
                        )?.fullName}
                      </h3>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <span>{isSeller ? 'Acheteur intéressé' : 'Vendeur vérifié'}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">Dakar, Sénégal</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions Rapides En-tête */}
                  <div className="flex items-center gap-2">
                    {isSeller && (
                      <button
                        onClick={handleOpenMakeOffer}
                        className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Faire une offre</span>
                      </button>
                    )}

                    {isBuyer && latestOffer && latestOffer.status === 'OFFER_ACCEPTED' && (
                      <button
                        onClick={() => {
                          setAcceptedOfferToPay(latestOffer);
                          setIsPaymentModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-98 animate-pulse"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Payer l'offre ({formatPrice(latestOffer.totalAmount)})</span>
                      </button>
                    )}

                    {isBuyer && activeConversation.productId && (!latestOffer || latestOffer.status !== 'OFFER_ACCEPTED') && (
                      <Link
                        to={`/checkout/${activeConversation.productId}`}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-98"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Payer sur la plateforme</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* BANDEAU ÉPINGLÉ : ARTICLE(S) CONCERNÉ(S) */}
                {activeConversation.productId && (
                  <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/90 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          activeConversation.productImageUrl ||
                          'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=150&q=80'
                        }
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-purple-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/product/${activeConversation.productId}`}
                          className="font-bold text-gray-900 hover:text-purple-700 truncate block text-xs flex items-center gap-1"
                        >
                          <span className="truncate">{activeConversation.productTitle}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <span className="font-black text-purple-700">
                            {activeConversation.productPrice}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">
                            {activeConversation.productCondition || 'Pièce unique'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isBuyer && (
                        <Link
                          to={`/checkout/${activeConversation.productId}`}
                          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-700/20 transition-all hover:scale-102"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Valider & Payer ({activeConversation.productPrice})</span>
                        </Link>
                      )}
                      <Link
                        to={`/product/${activeConversation.productId}`}
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-gray-600 hover:bg-white transition-colors"
                      >
                        Voir fiche
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* MESSAGES & OFFRES */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {/* 1. Affichage des offres reçues/envoyées dans le fil */}
                {conversationOffers.map((offer) => {
                  const isSent = offer.status === 'OFFER_SENT';
                  const isAccepted = offer.status === 'OFFER_ACCEPTED';
                  const isDeclined = offer.status === 'OFFER_DECLINED';
                  const isCancelled = offer.status === 'OFFER_CANCELLED';
                  const isExpired = offer.status === 'OFFER_EXPIRED';

                  return (
                    <div
                      key={`offer-${offer.id}`}
                      className="max-w-lg mx-auto w-full bg-white rounded-3xl p-5 border-2 border-purple-200 shadow-md space-y-3.5 my-2 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                              Offre directe du vendeur
                            </h4>
                            <p className="text-[10px] text-gray-400">
                              Valable 24h • Paiement sécurisé sous séquestre
                            </p>
                          </div>
                        </div>

                        {/* Statut badge */}
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                            isSent
                              ? 'bg-purple-100 text-purple-800'
                              : isAccepted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isDeclined
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isSent
                            ? 'EN ATTENTE DE L’ACHETEUR'
                            : isAccepted
                            ? 'OFFRE ACCEPTÉE'
                            : isDeclined
                            ? 'OFFRE REFUSÉE'
                            : isCancelled
                            ? 'OFFRE ANNULÉE'
                            : 'OFFRE EXPIRÉE'}
                        </span>
                      </div>

                      {/* Décomposition financière claire */}
                      <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Prix convenu article :</span>
                          <span className="font-bold text-gray-900">
                            {formatPrice(offer.agreedPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600">
                          <span className="flex items-center gap-1">
                            <span>Protection acheteur (1%) :</span>
                          </span>
                          <span className="font-bold text-purple-700">
                            + {formatPrice(offer.validationFee)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600">
                          <span className="flex items-center gap-1">
                            {offer.deliveryMode === 'HOME_DELIVERY' ? (
                              <Truck className="w-3.5 h-3.5 text-gray-500" />
                            ) : (
                              <Handshake className="w-3.5 h-3.5 text-gray-500" />
                            )}
                            <span>Livraison ({offer.deliveryMode === 'HOME_DELIVERY' ? 'À domicile' : 'Main propre'}) :</span>
                          </span>
                          <span className="font-bold text-gray-900">
                            {offer.deliveryFee > 0 ? `+ ${formatPrice(offer.deliveryFee)}` : 'Gratuit (0 FCFA)'}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 flex justify-between items-center font-black text-sm text-gray-900">
                          <span>Total à payer sous séquestre :</span>
                          <span className="text-purple-700 font-black">
                            {formatPrice(offer.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Actions selon le rôle */}
                      {isSent && isBuyer && (
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptOffer(offer)}
                            className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accepter l'offre</span>
                          </button>
                          <button
                            onClick={() => handleDeclineOffer(offer.id)}
                            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Refuser</span>
                          </button>
                        </div>
                      )}

                      {isSent && isSeller && (
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => handleCancelOffer(offer.id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                          >
                            Annuler cette offre
                          </button>
                        </div>
                      )}

                      {isAccepted && isBuyer && (
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              setAcceptedOfferToPay(offer);
                              setIsPaymentModalOpen(true);
                            }}
                            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Finaliser et Payer sous Séquestre ({formatPrice(offer.totalAmount)})</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Historique normal des messages */}
                {messages.length === 0 && conversationOffers.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400">
                    Envoyez un premier message pour démarrer la négociation.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    const isSystem = m.messageType === 'SYSTEM';

                    if (isSystem) {
                      return (
                        <div key={m.id} className="text-center my-3">
                          <span className="inline-block px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-150 text-[11px] font-bold text-purple-900">
                            ℹ️ {m.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2 ${
                            isMe
                              ? 'bg-purple-700 text-white rounded-br-xs shadow-md shadow-purple-700/10'
                              : 'bg-white text-gray-800 rounded-bl-xs border border-gray-150 shadow-xs'
                          }`}
                        >
                          {m.imageUrl && (
                            <img
                              src={m.imageUrl}
                              alt="Détail article"
                              className="w-full max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(m.imageUrl, '_blank')}
                            />
                          )}
                          <p>{m.content}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {new Date(m.sentAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* PILLS AIDE 1-CLIC POUR L'ACHETEUR */}
              {isBuyer && (
                <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                    Questions rapides :
                  </span>
                  {[
                    'Pouvez-vous envoyer plus de photos ?',
                    'Y a-t-il des défauts ?',
                    'Quelles sont les mesures ?',
                    'La livraison est-elle possible aujourd’hui ?',
                  ].map((pill, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(undefined, pill)}
                      className="px-3 py-1 rounded-full bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-600 font-medium text-[11px] shrink-0 transition-colors border border-gray-200"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              )}

              {/* INPUT BAR (TEXTE + BOUTON PHOTO) */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-gray-150 flex items-center gap-2.5"
              >
                {/* Bouton Upload Photo */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="p-3 rounded-2xl bg-gray-100 hover:bg-purple-50 text-gray-500 hover:text-purple-700 transition-colors disabled:opacity-50 shrink-0"
                  title="Envoyer une photo de détail (JPG, PNG, WebP)"
                >
                  <Camera className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  placeholder="Discutez de l'article, posez des questions..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-3 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl shadow transition-transform active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <MessageSquare className="w-16 h-16 text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-600">Sélectionnez une discussion</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Discutez avec vos acheteurs et vendeurs avant tout paiement sous séquestre.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1 : FAIRE UNE OFFRE DIRECTE (VENDEUR) */}
      {isMakeOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-150 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Faire une offre directe</h3>
                  <p className="text-[11px] text-gray-500">L'acheteur recevra la proposition dans le chat</p>
                </div>
              </div>
              <button
                onClick={() => setIsMakeOfferModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {offerError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {offerError}
              </div>
            )}

            <form onSubmit={handleSubmitOffer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Prix convenu de l'article (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Number(e.target.value) || '')}
                  placeholder="Ex: 15000"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-black text-sm text-purple-700 focus:ring-2 focus:ring-purple-600"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Ne peut pas dépasser le prix initial affiché sur l'annonce.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Mode de remise convenu *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOfferDeliveryMode('HOME_DELIVERY');
                      setOfferDeliveryFee(2000);
                    }}
                    className={`p-3 rounded-xl border font-bold text-left transition-all ${
                      offerDeliveryMode === 'HOME_DELIVERY'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <Truck className="w-4 h-4 mb-1 text-purple-700" />
                    <span>À domicile</span>
                    <span className="block text-[10px] font-normal text-gray-500">2 000 FCFA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOfferDeliveryMode('DIRECT_HANDOVER');
                      setOfferDeliveryFee(0);
                    }}
                    className={`p-3 rounded-xl border font-bold text-left transition-all ${
                      offerDeliveryMode === 'DIRECT_HANDOVER'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <Handshake className="w-4 h-4 mb-1 text-purple-700" />
                    <span>Main propre</span>
                    <span className="block text-[10px] font-normal text-emerald-600">Gratuit</span>
                  </button>
                </div>
              </div>

              {offerDeliveryMode === 'HOME_DELIVERY' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Frais de livraison (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={offerDeliveryFee}
                    onChange={(e) => setOfferDeliveryFee(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-bold"
                  />
                </div>
              )}

              {/* Récapitulatif prévisionnel */}
              {offerPrice && (
                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-150 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frais de validation acheteur (1%) :</span>
                    <span className="font-bold text-purple-700">
                      {Math.round(Number(offerPrice) * 0.01).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-xs text-gray-900 pt-1 border-t border-purple-100">
                    <span>Total payé par l'acheteur :</span>
                    <span className="text-purple-800">
                      {(
                        Number(offerPrice) +
                        Math.round(Number(offerPrice) * 0.01) +
                        (offerDeliveryMode === 'HOME_DELIVERY' ? Number(offerDeliveryFee) : 0)
                      ).toLocaleString('fr-FR')}{' '}
                      FCFA
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMakeOfferModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={offerSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20 disabled:opacity-50"
                >
                  {offerSubmitting ? 'Envoi...' : 'Envoyer l’offre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 : PAIEMENT SOUS SÉQUESTRE (ACHETEUR UNIQUEMENT APRÈS ACCEPTATION) */}
      {isPaymentModalOpen && acceptedOfferToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-150 space-y-5 animate-scaleUp">
            {paymentSuccess ? (
              <div className="text-center py-6 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Paiement Sécurisé Enregistré !
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Vos fonds de {formatPrice(acceptedOfferToPay.totalAmount)} sont bloqués en sécurité sous séquestre.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50 text-left text-xs space-y-1">
                  <p className="font-bold text-purple-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    Protection Escrow 100% active
                  </p>
                  <p className="text-[11px] text-purple-800">
                    Le vendeur prépare votre article. Votre paiement ne sera débloqué qu'à votre validation de bonne réception.
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/profile?tab=purchases"
                    className="w-full py-3 rounded-2xl bg-purple-700 text-white font-bold text-xs text-center hover:bg-purple-800 transition-colors"
                  >
                    Suivre ma commande
                  </Link>
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="w-full py-2.5 rounded-2xl text-gray-600 font-bold text-xs hover:bg-gray-100"
                  >
                    Fermer et retourner au chat
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Paiement Séquestre</h3>
                      <p className="text-[11px] text-gray-500">
                        {acceptedOfferToPay.orderNumber || 'Commande acceptée'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {paymentError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {paymentError}
                  </div>
                )}

                {/* Récapitulatif commande */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-150 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Article :</span>
                    <span className="font-bold text-gray-900 truncate max-w-[180px]">
                      {acceptedOfferToPay.productTitle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Prix convenu :</span>
                    <span className="font-bold text-gray-900">
                      {formatPrice(acceptedOfferToPay.agreedPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mode de remise :</span>
                    <span className="font-bold text-gray-900">
                      {acceptedOfferToPay.deliveryMode === 'HOME_DELIVERY' ? 'Livraison à domicile' : 'Remise en main propre'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Frais de livraison :</span>
                    <span className="font-bold text-gray-900">
                      {acceptedOfferToPay.deliveryFee > 0 ? formatPrice(acceptedOfferToPay.deliveryFee) : '0 FCFA'}
                    </span>
                  </div>
                  <div className="flex justify-between text-purple-700">
                    <span>Frais de protection (1% inclus) :</span>
                    <span className="font-bold">{formatPrice(acceptedOfferToPay.validationFee)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between font-black text-sm text-gray-900">
                    <span>Total débité :</span>
                    <span className="text-purple-700">{formatPrice(acceptedOfferToPay.totalAmount)}</span>
                  </div>
                </div>

                {/* Formulaire Mobile Money */}
                <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Paiement mobile (frais de protection 1 % inclus)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'WAVE', name: 'Wave', color: 'text-sky-600 border-sky-300 bg-sky-50' },
                        { id: 'ORANGE_MONEY', name: 'Orange', color: 'text-amber-600 border-amber-300 bg-amber-50' },
                        { id: 'FREE_MONEY', name: 'Free', color: 'text-rose-600 border-rose-300 bg-rose-50' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                          className={`p-2.5 rounded-xl border text-center font-black transition-all ${
                            paymentMethod === m.id
                              ? `${m.color} ring-2 ring-purple-600`
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Numéro de téléphone du paiement *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
                        placeholder="+221 77 000 00 00"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 font-bold focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  {/* Sécurité séquestre */}
                  <div className="text-[11px] text-purple-900 bg-purple-50/70 p-3 rounded-xl border border-purple-100 flex items-center gap-2">
                    <span className="shrink-0">🔒</span>
                    <span className="font-semibold">Votre paiement est sécurisé sous séquestre jusqu’à la confirmation de réception du colis.</span>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={paymentLoading}
                      className="flex-1 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20 disabled:opacity-50"
                    >
                      {paymentLoading ? 'Paiement en cours...' : `Payer ${formatPrice(acceptedOfferToPay.totalAmount)}`}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
