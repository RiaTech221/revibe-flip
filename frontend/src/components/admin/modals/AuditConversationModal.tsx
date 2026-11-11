import React from 'react';
import { X, History, ShieldCheck } from 'lucide-react';

interface AuditConversationModalProps {
  modal: {
    isOpen: boolean;
    data: any | null;
    loading: boolean;
  };
  onClose: () => void;
}

export const AuditConversationModal: React.FC<AuditConversationModalProps> = ({
  modal,
  onClose,
}) => {
  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 border border-gray-150 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-150 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">
                Discussion Archivée (Lecture seule modérateur)
              </h3>
              <p className="text-[11px] text-gray-500">
                Consultation pour arbitrage de litige
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avertissement d'audit */}
        <div className="p-3 bg-purple-50 rounded-2xl border border-purple-150 text-[11px] text-purple-900 flex items-center gap-2 shrink-0">
          <History className="w-4 h-4 text-purple-700 shrink-0" />
          <span>
            <strong>Traçabilité légale :</strong> Cette consultation est journalisée dans le journal
            d'audit administrateur avec votre identifiant et votre adresse IP.
          </span>
        </div>

        {modal.loading ? (
          <div className="py-12 text-center text-xs text-gray-400">
            Chargement des messages de la discussion...
          </div>
        ) : modal.data ? (
          <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-2xl">
            {modal.data.messages?.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">Aucun message échangé.</p>
            ) : (
              modal.data.messages?.map((m: any) => (
                <div
                  key={m.id}
                  className="p-3 bg-white rounded-xl border border-gray-200 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <strong className="text-gray-800 font-bold">{m.senderName}</strong>
                    <span>
                      {new Date(m.sentAt).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  {m.imageUrl && (
                    <img src={m.imageUrl} alt="" className="max-h-40 rounded-lg object-cover" />
                  )}
                  <p className="text-gray-700">{m.content}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-400">
            Impossible de charger cette discussion.
          </div>
        )}

        <div className="pt-2 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
