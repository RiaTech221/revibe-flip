/**
 * Composant d'Authentification : AuthRegisterForm
 *
 * Inscription rapide par numéro de téléphone sénégalais (+221) uniquement.
 */

import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import { TurnstileWidget, isTurnstileEnabled } from '../security/TurnstileWidget';

interface AuthRegisterFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (
    formData: {
      phone: string;
      countryCode: string;
    },
    turnstileToken?: string
  ) => void;
  onSwitchToLogin?: () => void;
}

const formatSenegalPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean);
  return parts.join(' ');
};

export const AuthRegisterForm: React.FC<AuthRegisterFormProps> = ({
  loading,
  error,
  onSubmit,
  onSwitchToLogin,
}) => {
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);

  useEffect(() => {
    if (error) {
      setTurnstileReset((n) => n + 1);
    }
  }, [error]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneDisplay(formatSenegalPhone(e.target.value));
    if (localError) setLocalError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const digits = phoneDisplay.replace(/\D/g, '');
    if (!/^7\d{8}$/.test(digits)) {
      setLocalError('Veuillez saisir un numéro sénégalais valide au format 7X XXX XX XX.');
      return;
    }

    onSubmit(
      {
        phone: `+221${digits}`,
        countryCode: 'SN',
      },
      turnstileToken || undefined
    );
  };

  const displayError = error || localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold animate-fadeIn">
          {displayError}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Numéro de téléphone (Sénégal)
        </label>
        <div className="flex items-stretch rounded-2xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent overflow-hidden transition-all">
          <div className="flex items-center gap-1.5 px-3.5 bg-slate-100 border-r border-slate-200 text-xs sm:text-sm font-black text-slate-700 select-none shrink-0">
            <span>🇸🇳</span>
            <span>+221</span>
          </div>
          <div className="relative flex-1 flex items-center">
            <Phone className="w-4 h-4 text-slate-400 ml-3 shrink-0 pointer-events-none" />
            <input
              type="tel"
              inputMode="numeric"
              required
              value={phoneDisplay}
              onChange={handlePhoneChange}
              placeholder="7X XXX XX XX"
              maxLength={12}
              className="w-full h-12 px-3 bg-transparent text-sm sm:text-base text-slate-900 font-bold tracking-wide focus:outline-none font-mono"
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          Un code de confirmation OTP à 6 chiffres vous sera envoyé par SMS.
        </p>
      </div>

      <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileReset} />

      <button
        type="submit"
        disabled={loading || (isTurnstileEnabled && !turnstileToken)}
        className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Envoi du code OTP...' : 'Continuer'}
      </button>

      {onSwitchToLogin && (
        <p className="text-center text-xs text-slate-500 pt-2">
          Déjà inscrit ?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-purple-700 font-bold hover:underline cursor-pointer"
          >
            Se connecter
          </button>
        </p>
      )}
    </form>
  );
};
