/**
 * Composant d'Authentification : AuthLoginForm
 * 
 * Gère une sous-partie du processus d'inscription, connexion ou vérification OTP (AuthLoginForm).
 */

import React, { useState } from 'react';
import { Lock, Phone } from 'lucide-react';

interface AuthLoginFormProps {
  initialIdentifier?: string;
  loading: boolean;
  error: string | null;
  onSubmit: (identifier: string, password: string) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(identifier.trim(), password);
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

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-2xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        {loading ? 'Connexion en cours...' : 'Se connecter'}
      </button>

      {/* Raccourci de test démonstration */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400 font-medium mb-1.5">
          Comptes de test pré-remplis (cliquez pour remplir) :
        </p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          <button
            type="button"
            onClick={() => {
              setIdentifier('+221770000000');
              setPassword('Admin1234!');
            }}
            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-[10px] font-bold transition-colors cursor-pointer"
          >
            Admin (+221770000000)
          </button>
          <button
            type="button"
            onClick={() => {
              setIdentifier('+221771112233');
              setPassword('Passer123!');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
          >
            Vendeuse Aminata (+221771112233)
          </button>
          <button
            type="button"
            onClick={() => {
              setIdentifier('+221774445566');
              setPassword('Passer123!');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
          >
            Vendeur Moussa (+221774445566)
          </button>
          <button
            type="button"
            onClick={() => {
              setIdentifier('+221778889900');
              setPassword('Passer123!');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
          >
            Acheteuse Fatou (+221778889900)
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Mots de passe : <code className="text-purple-600 font-mono">Passer123!</code> ou <code className="text-purple-600 font-mono">Admin1234!</code>
        </p>
      </div>

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
