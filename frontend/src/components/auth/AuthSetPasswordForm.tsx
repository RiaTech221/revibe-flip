import React, { useState } from 'react';
import { Lock, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface AuthSetPasswordFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (password: string) => void;
  onSkip: () => void;
}

export const AuthSetPasswordForm: React.FC<AuthSetPasswordFormProps> = ({
  loading,
  error,
  onSubmit,
  onSkip,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password.length < 8) {
      setLocalError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setLocalError('Le mot de passe doit contenir au moins une lettre et un chiffre.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    onSubmit(password);
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>Numéro vérifié !</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Créer votre mot de passe
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Définissez un mot de passe pour pouvoir vous reconnecter facilement avec votre numéro.
        </p>
      </div>

      {displayError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Nouveau mot de passe
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 caractères (lettres + chiffres)"
            required
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Retapez votre mot de passe"
            required
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-pink-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-purple-700/20 transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Enregistrement...' : 'Enregistrer et continuer'}
      </button>

      <button
        type="button"
        onClick={onSkip}
        disabled={loading}
        className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
      >
        Passer pour le moment
      </button>
    </form>
  );
};
