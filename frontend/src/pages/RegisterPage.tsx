import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, countryApi } from '../services/api';
import { Country } from '../types';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('SN');
  const [phonePrefix, setPhonePrefix] = useState('+221');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP step
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = phone.startsWith('+') ? phone : phonePrefix + phone.replace(/^0+/, '');
      const res = await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: fullPhone.trim(),
        email: email.trim() || undefined,
        password,
        confirmPassword,
        countryCode: selectedCountryCode,
      });

      setPhone(fullPhone);
      setDemoOtp(res.data.data.otpDemoCode || null);
      setIsOtpStep(true);
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
      const res = await authApi.verifyOtp({ phone, otpCode: otpCode.trim() });
      const data = res.data.data;
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code OTP invalide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      {/* GAUCHE : SPLIT SCREEN SOMBRE ÉPURÉ */}
      <div className="w-full md:w-5/12 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10 flex items-center">
          <Logo variant="dark" size="md" />
        </div>

        <div className="relative z-10 space-y-4 my-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
            Rejoignez <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-orange-400 to-amber-300">
              REVIBE FLIP
            </span>
          </h1>

          <p className="text-sm text-slate-300 font-normal leading-relaxed max-w-sm">
            Créez votre compte en quelques secondes.
          </p>
        </div>

        <div className="relative z-10 text-[11px] text-slate-400">
          © {new Date().getFullYear()} ReVibe FliP. Tous droits réservés.
        </div>
      </div>

      {/* DROITE : FORMULAIRE INSCRIPTION OU OTP ÉPURÉ */}
      <div className="flex-1 bg-white flex flex-col justify-between p-6 sm:p-12 lg:p-16 relative">
        <div className="flex justify-end">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-all border border-gray-200 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au site</span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto my-auto space-y-5">
          {!isOtpStep ? (
            <>
              <div className="text-center space-y-1">
                <div className="inline-flex justify-center mb-2">
                  <Logo variant="light" size="lg" layout="stacked" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Inscription</h2>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Fatou"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Sow"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Téléphone</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-32 px-2.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-bold"
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>{c.flagEmoji} {c.phoneCode}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="77 000 00 00"
                      required
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email (facultatif)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="fatou@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Mot de passe</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Confirmation</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-black text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 mt-2"
                >
                  {loading ? 'Création...' : "S'inscrire"}
                </button>
              </form>

              <div className="pt-2 text-center text-xs text-gray-500">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-purple-700 font-bold hover:underline">
                  Se connecter
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-black text-gray-900">Code de vérification</h2>
              <p className="text-xs text-gray-500">
                Entrez le code SMS reçu au <strong className="text-gray-900">{phone}</strong>
              </p>

              {demoOtp && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900">
                  <span className="font-bold">Code : </span>
                  <span className="font-mono font-black text-base text-purple-700">{demoOtp}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="w-48 mx-auto text-center font-mono font-black text-2xl tracking-widest py-3 rounded-2xl bg-gray-50 border border-gray-300 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-black text-sm shadow-md"
                >
                  {loading ? 'Vérification...' : 'Valider'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div />
      </div>
    </div>
  );
};
