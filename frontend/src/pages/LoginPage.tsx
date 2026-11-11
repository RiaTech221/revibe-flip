import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Lock, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.login({ identifier: identifier.trim(), password });
      const data = res.data.data;

      if (data.token) {
        login(data.token, data.user);
        const searchParams = new URLSearchParams(location.search);
        const redirectParam = searchParams.get('redirect');
        const from = (location.state as any)?.from?.pathname;

        if (data.user.role === 'ROLE_ADMIN') {
          navigate('/admin');
        } else if (redirectParam) {
          navigate(redirectParam);
        } else if (from) {
          navigate(from);
        } else if (data.user.phone === '+221771112233' || data.user.phone === '+221772223344') {
          navigate('/seller');
        } else {
          navigate('/');
        }
      } else if (data.otpDemoCode) {
        navigate(`/verify-otp?phone=${encodeURIComponent(identifier)}&code=${encodeURIComponent(data.otpDemoCode)}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants invalides. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      {/* GAUCHE : SPLIT SCREEN SOMBRE ÉPURÉ */}
      <div className="w-full md:w-5/12 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center">
          <Logo variant="dark" size="md" />
        </div>

        {/* Center Copy Épuré */}
        <div className="relative z-10 space-y-4 my-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
            Accès à <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-orange-400 to-amber-300">
              REVIBE FLIP
            </span>
          </h1>

          <p className="text-sm text-slate-300 font-normal leading-relaxed max-w-sm">
            La marketplace sénégalaise de seconde main.
          </p>
        </div>

        {/* Bottom Tagline */}
        <div className="relative z-10 text-[11px] text-slate-400">
          © {new Date().getFullYear()} ReVibe FliP. Tous droits réservés.
        </div>
      </div>

      {/* DROITE : FORMULAIRE DE CONNEXION ÉPURÉ */}
      <div className="flex-1 bg-white flex flex-col justify-between p-6 sm:p-12 lg:p-16 relative">
        {/* Top Right Action: Retour au site */}
        <div className="flex justify-end">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-all border border-gray-200 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au site</span>
          </Link>
        </div>

        {/* Center Form Container */}
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex justify-center mb-2">
              <Logo variant="light" size="lg" layout="stacked" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Connexion</h2>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Téléphone ou Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-gray-400 font-bold">@</span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="+221 77 000 00 00 ou email"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-2xl bg-gray-50/80 border border-gray-200 text-gray-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-700">Mot de passe</label>
                <span className="text-[11px] text-purple-700 hover:underline cursor-pointer">
                  Mot de passe oublié ?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-2xl bg-gray-50/80 border border-gray-200 text-gray-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-black text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 mt-2"
            >
              {loading ? 'Connexion...' : 'Connexion'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <span className="text-xs text-gray-500">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-purple-700 font-bold hover:underline">
                S'inscrire
              </Link>
            </span>
          </div>

          {/* Remplissage test rapide compact */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-[10px] text-gray-400">Test :</span>
            <button
              type="button"
              onClick={() => { setIdentifier('+221770000000'); setPassword('Admin1234!'); }}
              className="px-2.5 py-1 bg-gray-100 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[10px] transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => { setIdentifier('+221771112233'); setPassword('Passer123!'); }}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[10px] transition-colors"
            >
              Vendeur
            </button>
            <button
              type="button"
              onClick={() => { setIdentifier('+221778889900'); setPassword('Passer123!'); }}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[10px] transition-colors"
            >
              Acheteur
            </button>
          </div>
        </div>

        <div />
      </div>
    </div>
  );
};
