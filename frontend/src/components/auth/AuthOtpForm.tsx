/**
 * Composant d'Authentification : AuthOtpForm
 * 
 * Gère une sous-partie du processus d'inscription, connexion ou vérification OTP (AuthOtpForm).
 */

import React, { useState } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { authApi } from '../../services/authService';

interface AuthOtpFormProps {
  phone: string;
  loading: boolean;
  error: string | null;
  onSubmit: (otpCode: string) => void;
  onBack?: () => void;
}

/**
 * Formulaire de validation du code OTP par SMS.
 */
export const AuthOtpForm: React.FC<AuthOtpFormProps> = ({
  phone,
  loading,
  error,
  onSubmit,
  onBack,
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(otpCode.trim());
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage(null);
    try {
      await authApi.resendOtp(phone);
      setResendMessage('Nouveau code envoyé par SMS.');
    } catch {
      setResendMessage('Erreur lors du renvoi du code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-slate-900">Vérification SMS</h3>
        <p className="text-xs text-slate-500">
          Un code de sécurité à 6 chiffres a été envoyé au{' '}
          <strong className="text-slate-800">{phone}</strong>
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {resendMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold">
          {resendMessage}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
          Code de confirmation
        </label>
        <input
          type="text"
          required
          maxLength={6}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="w-full h-12 text-center text-xl tracking-[0.3em] font-black rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={loading || otpCode.length < 4}
        className="w-full h-11 rounded-2xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        {loading ? 'Validation...' : 'Valider et continuer'}
      </button>

      <div className="flex items-center justify-between pt-2 text-xs">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
          >
            Modifier le numéro
          </button>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-purple-700 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 ml-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
          <span>Renvoyer le code</span>
        </button>
      </div>
    </form>
  );
};
