/**
 * Composant Messagerie & Négociation : ChatInputBar
 * 
 * Gère les échanges de chat, propositions d'offres et modales associées (ChatInputBar).
 */

import React, { useRef } from 'react';
import { Camera, Send } from 'lucide-react';

interface ChatInputBarProps {
  newMessage: string;
  setNewMessage: (msg: string) => void;
  onSendMessage: (e?: React.FormEvent, customContent?: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sending: boolean;
  uploadingImage: boolean;
  isBuyer: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  newMessage,
  setNewMessage,
  onSendMessage,
  onImageUpload,
  sending,
  uploadingImage,
  isBuyer,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
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
              onClick={() => onSendMessage(undefined, pill)}
              className="px-3 py-1 rounded-full bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-600 font-medium text-[11px] shrink-0 transition-colors border border-gray-200"
            >
              {pill}
            </button>
          ))}
        </div>
      )}

      {/* INPUT BAR (TEXTE + BOUTON PHOTO) */}
      <form
        onSubmit={onSendMessage}
        className="p-4 bg-white border-t border-gray-150 flex items-center gap-2.5"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onImageUpload}
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
  );
};
