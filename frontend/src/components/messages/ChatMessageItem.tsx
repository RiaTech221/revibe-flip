/**
 * Composant Messagerie & Négociation : ChatMessageItem
 * 
 * Gère les échanges de chat, propositions d'offres et modales associées (ChatMessageItem).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Message } from '../../types';
import { formatImageUrl } from '../../utils/imageUrl';

interface ChatMessageItemProps {
  message: Message;
  currentUserId?: number;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, currentUserId }) => {
  const isMe = message.senderId === currentUserId;
  const isSystem = message.messageType === 'SYSTEM';
  const hasProductCard = Boolean(message.productTitle || message.productId);
  const cardImage = message.productImageUrl || message.imageUrl;

  if (isSystem) {
    return (
      <div className="text-center my-3">
        <span className="inline-block px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-150 text-[11px] font-bold text-purple-900">
          ℹ️ {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2 ${
          isMe
            ? 'bg-purple-700 text-white rounded-br-xs shadow-md shadow-purple-700/10'
            : 'bg-white text-gray-800 rounded-bl-xs border border-gray-150 shadow-xs'
        }`}
      >
        {hasProductCard ? (
          <Link
            to={message.productId ? `/product/${message.productId}` : '#'}
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
              isMe
                ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
            }`}
          >
            {cardImage && (
              <img
                src={formatImageUrl(cardImage)}
                alt={message.productTitle || 'Article'}
                className="w-12 h-12 rounded-lg object-cover shrink-0 bg-gray-200"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-purple-200' : 'text-purple-700'}`}>
                Article concerné
              </p>
              <p className="font-bold text-xs sm:text-sm truncate">
                {message.productTitle || 'Article'}
              </p>
            </div>
          </Link>
        ) : (
          message.imageUrl && (
            <img
              src={formatImageUrl(message.imageUrl)}
              alt="Détail article"
              className="w-full max-w-[260px] max-h-56 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => window.open(formatImageUrl(message.imageUrl), '_blank')}
            />
          )
        )}
        <p>{message.content}</p>
      </div>
      <span className="text-[10px] text-gray-400 mt-1 px-1">
        {new Date(message.sentAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
};
