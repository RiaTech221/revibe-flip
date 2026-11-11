import React from 'react';
import { Conversation, User } from '../../types';
import { RefreshCw } from 'lucide-react';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  onRefresh: () => void;
  loading: boolean;
  currentUser: User | null;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversation,
  onSelectConversation,
  onRefresh,
  loading,
  currentUser,
}) => {
  return (
    <div className="md:col-span-4 border-r border-gray-150 flex flex-col bg-white">
      <div className="p-4 border-b border-gray-150 flex items-center justify-between">
        <h3 className="font-black text-xs text-gray-700 uppercase tracking-wider">
          Discussions ({conversations.length})
        </h3>
        <button
          onClick={onRefresh}
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
            const otherUser = c.buyer?.id === currentUser?.id ? c.seller : c.buyer;
            return (
              <button
                key={c.id}
                onClick={() => onSelectConversation(c)}
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
  );
};
