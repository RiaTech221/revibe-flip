import React from 'react';
import { Message } from '../../types';

interface ChatMessageItemProps {
  message: Message;
  currentUserId?: number;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, currentUserId }) => {
  const isMe = message.senderId === currentUserId;
  const isSystem = message.messageType === 'SYSTEM';

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
        className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2 ${
          isMe
            ? 'bg-purple-700 text-white rounded-br-xs shadow-md shadow-purple-700/10'
            : 'bg-white text-gray-800 rounded-bl-xs border border-gray-150 shadow-xs'
        }`}
      >
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Détail article"
            className="w-full max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => window.open(message.imageUrl, '_blank')}
          />
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
