import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { chatApi } from '../services/api';
import { Conversation, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  MessageSquare,
  ShoppingBag,
  User as UserIcon,
  CheckCheck,
  Clock,
  ArrowRight
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = (selectId?: number) => {
    chatApi.getConversations().then((res) => {
      if (res.data?.data) {
        setConversations(res.data.data);
        if (selectId) {
          const target = res.data.data.find((c) => c.id === selectId);
          if (target) setActiveConversation(target);
        } else if (!activeConversation && res.data.data.length > 0) {
          setActiveConversation(res.data.data[0]);
        }
      }
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const paramId = searchParams.get('conversationId');
    fetchConversations(paramId ? Number(paramId) : undefined);
  }, [isAuthenticated, searchParams]);

  const fetchMessages = (convId: number) => {
    chatApi.getMessages(convId).then((res) => {
      if (res.data?.data) {
        setMessages(res.data.data);
        scrollToBottom();
      }
    }).catch(console.error);
  };

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      const interval = setInterval(() => {
        fetchMessages(activeConversation.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConversation?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      const res = await chatApi.sendMessage({
        conversationId: activeConversation.id,
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, res.data.data]);
      setNewMessage('');
      scrollToBottom();
      // Update snippet in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, lastMessagePreview: res.data.data.content, lastMessageAt: res.data.data.sentAt }
            : c
        )
      );
    } catch (err) {
      alert("Erreur lors de l'envoi du message.");
    } finally {
      setSending(false);
    }
  };

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
      <h1 className="text-2xl font-black text-gray-900 mb-6">
        Messagerie directe
      </h1>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px] max-h-[750px]">
        {/* CONVERSATION LIST (4 cols) */}
        <div className="md:col-span-4 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider">
              Vos discussions ({conversations.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="p-4 text-center text-xs text-gray-400">Chargement...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Aucune conversation active. Contactez un vendeur depuis une fiche produit !
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
                      isCurrent ? 'bg-purple-50/80 border-l-4 border-purple-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={otherUser?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.fullName || 'U')}&background=9333ea&color=fff`}
                      alt={otherUser?.fullName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{otherUser?.fullName}</h4>
                        {c.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
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
                        {c.lastMessagePreview || 'Nouvelle conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ACTIVE CHAT (8 cols) */}
        <div className="md:col-span-8 flex flex-col bg-gray-50/30">
          {activeConversation ? (
            <>
              {/* Chat Header with Product Banner */}
              <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      (activeConversation.buyer?.id === user?.id ? activeConversation.seller : activeConversation.buyer)?.profilePicture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        (activeConversation.buyer?.id === user?.id ? activeConversation.seller : activeConversation.buyer)?.fullName || 'U'
                      )}&background=9333ea&color=fff`
                    }
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {(activeConversation.buyer?.id === user?.id ? activeConversation.seller : activeConversation.buyer)?.fullName}
                    </h3>
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      En ligne • Sénégal
                    </p>
                  </div>
                </div>

                {/* Product quick buy shortcut if attached */}
                {activeConversation.productId && (
                  <div className="flex items-center gap-3 bg-purple-50 px-3 py-1.5 rounded-2xl border border-purple-100 shrink-0">
                    {activeConversation.productImageUrl && (
                      <img
                        src={activeConversation.productImageUrl}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    )}
                    <div className="text-left hidden sm:block">
                      <span className="block text-[11px] font-bold text-gray-800 truncate max-w-[130px]">
                        {activeConversation.productTitle}
                      </span>
                      <span className="text-[10px] font-extrabold text-purple-700">
                        {activeConversation.productPrice}
                      </span>
                    </div>
                    <Link
                      to={`/checkout/${activeConversation.productId}`}
                      className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] rounded-xl transition-colors"
                    >
                      Acheter
                    </Link>
                  </div>
                )}
              </div>

              {/* Message History */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400">
                    Envoyez un premier message pour démarrer la discussion.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-purple-700 text-white rounded-br-xs shadow-md'
                              : 'bg-white text-gray-800 rounded-bl-xs border border-gray-100 shadow-sm'
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Écrivez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-3 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl shadow transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <MessageSquare className="w-16 h-16 text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-600">Sélectionnez une conversation</p>
              <p className="text-xs text-gray-400 mt-1">Échangez avec vos acheteurs ou vendeurs en direct.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
