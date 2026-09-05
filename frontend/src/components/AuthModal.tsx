import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi, countryApi } from '../services/api';
import { Country } from '../types';
import { X, Phone, Lock, User, Mail, Globe, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, pendingPhone, closeAuthModal, login, openAuthModal } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'otp'>(authModalMode);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('SN');
  const [phonePrefix, setPhonePrefix] = useState('+221');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  // States
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(authModalMode);
    if (pendingPhone) {
      setPhone(pendingPhone);
    }
  }, [authModalMode, pendingPhone]);

  useEffect(() => {
    countryApi.getAll().then((res) => {
      if (res.data && res.data.data) {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ identifier: phone, password });
      const data = res.data.data;
      if (data.token) {
        login(data.token, data.user);
      } else if (data.otpDemoCode) {
        // Account unverified, redirect to OTP
        setDemoOtp(data.otpDemoCode);
        setMode('otp');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      // Ensure phone includes international dial code
      const fullPhone = phone.startsWith('+') ? phone : phonePrefix + phone.replace(/^0+/, '');
      const res = await authApi.register({
        firstName,
        lastName,
        phone: fullPhone,
        email: email || undefined,
        password,
        confirmPassword,
        countryCode: selectedCountryCode,
      });

      setPhone(fullPhone);
      setDemoOtp(res.data.data.otpDemoCode || null);
      setMode('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ phone, otpCode });
      const data = res.data.data;
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code OTP invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    try {
      const res = await authApi.resendOtp(phone);
      setDemoOtp(res.data.data);
      alert('Nouveau code OTP envoyé !');
    } catch (err: any) {
      setError(err.response?.data?.message || "Impossible de renvoyer l'OTP.");
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-pink-600 p-6 text-white text-center">
          <div className="flex justify-center mb-2">
            <img src="/logo.png" alt="ReVibe FliP" className="h-14 w-auto object-contain brightness-110 drop-shadow" />
          </div>
          <h2 className="text-xl font-bold">
            {mode === 'login' && 'Connexion à votre compte'}
            {mode === 'register' && 'Créer votre compte ReVibe FliP'}
            {mode === 'otp' && 'Vérification de sécurité SMS'}
          </h2>
          <p className="text-xs text-purple-100 mt-1">
            {mode === 'login' && 'Accédez à vos annonces, commandes et messages'}
            {mode === 'register' && 'Achetez et vendez facilement en toute confiance'}
            {mode === 'otp' && `Entrez le code envoyé au ${phone}`}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Numéro de téléphone ou Email
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="+221 77 123 45 67 ou email@exemple.com"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all transform active:scale-98 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-gray-500">
                Vous n'avez pas de compte ?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="text-purple-700 font-bold hover:underline"
                >
                  S'inscrire
                </button>
              </div>

              {/* Demo quick logins */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 font-medium text-center mb-2">Comptes de démonstration rapide :</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => { setPhone('+221771112233'); setPassword('Passer123!'); }}
                    className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-[11px] font-semibold text-left transition-colors"
                  >
                    🛍️ Vendeuse Aminata (+221 77 111 22 33)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhone('+221770000000'); setPassword('Admin1234!'); }}
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-semibold text-left transition-colors"
                  >
                    🛡️ Administrateur (+221 77 000 00 00)
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    placeholder="Fatou"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    placeholder="Sow"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Country Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Pays de résidence
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flagEmoji} {c.name} ({c.phoneCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phone Number with synchronized Dialing Code */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Numéro de téléphone
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-bold text-sm">
                    {phonePrefix}
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="77 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email (facultatif)
                </label>
                <input
                  type="email"
                  placeholder="contact@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirmer</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all text-sm disabled:opacity-50"
              >
                {loading ? 'Création en cours...' : 'Créer mon compte'}
              </button>

              <div className="pt-1 text-center text-xs text-gray-500">
                Déjà inscrit ?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-purple-700 font-bold hover:underline"
                >
                  Se connecter
                </button>
              </div>
            </form>
          )}

          {/* OTP VERIFICATION FORM */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                <ShieldCheck className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                <p className="text-xs text-gray-700 font-medium">
                  Un code de validation à 6 chiffres a été généré pour le numéro :
                </p>
                <p className="text-sm font-bold text-purple-900 mt-0.5">{phone}</p>

                {demoOtp && (
                  <div className="mt-3 py-1.5 px-3 bg-white rounded-xl border border-purple-200 shadow-sm inline-block">
                    <span className="text-xs text-gray-500">Code de test (Démo) : </span>
                    <strong className="text-sm text-purple-700 font-mono tracking-widest">{demoOtp}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 text-center">
                  Saisir le code OTP reçu par SMS
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.trim())}
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm disabled:opacity-50"
              >
                {loading ? 'Vérification...' : 'Valider mon compte'}
              </button>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-purple-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Renvoyer le code
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-gray-500 hover:underline"
                >
                  Modifier le numéro
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
