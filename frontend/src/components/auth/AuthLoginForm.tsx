/**
 * Composant d'Authentification : AuthLoginForm
 * 
 * Gère une sous-partie du processus d'inscription, connexion ou vérification OTP (AuthLoginForm).
 */

import React, { useState, useEffect } from 'react';
import { Lock, Phone, Sparkles } from 'lucide-react';
import { TurnstileWidget, isTurnstileEnabled } from '../security/TurnstileWidget';

const TEST_ACCOUNTS = [
  {
    role: 'Admin',
    label: '🛡️ Admin',
    identifier: '+221770000000',
    password: 'Admin1234!',
    color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  },
  {
    role: 'Vendeuse',
    label: '👗 Aminata',
    identifier: '+221771112233',
    password: 'Passer123!',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
  {
    role: 'Vendeur',
    label: '👔 Moussa',
    identifier: '+221774445566',
    password: 'Passer123!',
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  {
    role: 'Acheteuse',
    label: '🛍️ Fatou',
    identifier: '+221778889900',
    password: 'Passer123!',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
];

interface AuthLoginFormProps {
  initialIdentifier?: string;
  loading: boolean;
  error: string | null;
  onSubmit: (identifier: string, password: string, turnstileToken?: string) => void;
  onSwitchToRegister?: () => void;
}

/**
 * Formulaire de connexion épuré (Numéro de téléphone / Email + Mot de passe).
 */
export const AuthLoginForm: React.FC<AuthLoginFormProps> = ({
  initialIdentifier = '',
  loading,
  error,
  onSubmit,
  onSwitchToRegister,
}) => {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);

  useEffect(() => {
    if (error) {
      setTurnstileReset((n) => n + 1);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(identifier.trim(), password, turnstileToken || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold animate-fadeIn">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Numéro de téléphone ou Email
        </label>
        <div className="relative">
          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="+221 77 000 00 00 ou email"
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700">Mot de passe</label>
          <span className="text-[11px] font-bold text-purple-700 hover:text-purple-800 cursor-pointer">
            Mot de passe oublié ?
          </span>
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Raccourcis de test en environnement local */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 mb-2 text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Comptes de test (clic pour remplir) :
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {TEST_ACCOUNTS.map((acc) => (
            <button
              key={acc.identifier}
              type="button"
              onClick={() => {
                setIdentifier(acc.identifier);
                setPassword(acc.password);
              }}
              className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold transition-all text-center cursor-pointer shadow-sm ${acc.color}`}
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>

      <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileReset} />

      <button
        type="submit"
        disabled={loading || (isTurnstileEnabled && !turnstileToken)}
        className="w-full h-11 rounded-2xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        {loading ? 'Connexion en cours...' : 'Se connecter'}
      </button>

      {onSwitchToRegister && (
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Pas encore de compte ?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-bold text-purple-700 hover:text-purple-800 cursor-pointer"
            >
              Créer un compte
            </button>
          </p>
        </div>
      )}
    </form>
  );
};
