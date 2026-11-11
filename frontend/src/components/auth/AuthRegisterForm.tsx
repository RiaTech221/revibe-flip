import React, { useState, useEffect } from 'react';
import { Country } from '../../types';
import { countryApi } from '../../services/productService';
import { Phone, Lock, User, Mail, Globe } from 'lucide-react';

interface AuthRegisterFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (formData: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    password: string;
    confirmPassword: string;
    countryCode: string;
  }) => void;
  onSwitchToLogin?: () => void;
}

/**
 * Formulaire d'inscription épuré avec sélecteur de pays / indicatif téléphonique.
 */
export const AuthRegisterForm: React.FC<AuthRegisterFormProps> = ({
  loading,
  error,
  onSubmit,
  onSwitchToLogin,
}) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('SN');
  const [phonePrefix, setPhonePrefix] = useState('+221');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    countryApi.getAll().then((res) => {
      if (res.data?.data) {
        setCountries(res.data.data);
      }
    }).catch(console.error);
  }, []);

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    const country = countries.find((c) => c.code === code);
    if (country) {
      setPhonePrefix(country.phoneCode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Les mots de passe ne correspondent pas.');
      return;
    }

    const fullPhone = phone.startsWith('+') ? phone : phonePrefix + phone.replace(/^0+/, '');

    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: fullPhone.trim(),
      email: email.trim() || undefined,
      password,
      confirmPassword,
      countryCode: selectedCountryCode,
    });
  };

  const displayError = error || localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {displayError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold animate-fadeIn">
          {displayError}
        </div>
      )}

      {/* Pays */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Pays de résidence</label>
        <div className="relative">
          <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedCountryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full h-11 pl-10 pr-8 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white font-medium cursor-pointer"
          >
            {countries.length === 0 ? (
              <option value="SN">Sénégal (+221)</option>
            ) : (
              countries.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.name} ({c.phoneCode})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Prénom & Nom */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Prénom</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Fatou"
              className="w-full h-11 pl-9 pr-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Nom</label>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Diallo"
            className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white font-medium"
          />
        </div>
      </div>

      {/* Numéro de téléphone */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de téléphone</label>
        <div className="flex gap-2">
          <span className="h-11 px-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs sm:text-sm text-purple-700 shrink-0">
            {phonePrefix}
          </span>
          <div className="relative flex-1">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="77 123 45 67"
              className="w-full h-11 pl-9 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* Email (optionnel) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Email <span className="text-slate-400 font-normal">(Optionnel)</span>
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="fatou.diallo@exemple.com"
            className="w-full h-11 pl-9 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white font-medium"
          />
        </div>
      </div>

      {/* Mot de passe & Confirmation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 car."
              className="w-full h-11 pl-9 pr-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Confirmer</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Répéter"
            className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white font-medium"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-2xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-4"
      >
        {loading ? 'Création du compte...' : 'Créer mon compte'}
      </button>

      {onSwitchToLogin && (
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Vous avez déjà un compte ?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-purple-700 hover:text-purple-800 cursor-pointer"
            >
              Se connecter
            </button>
          </p>
        </div>
      )}
    </form>
  );
};
