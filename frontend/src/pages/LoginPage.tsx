/**
 * Page de Connexion ReVibe FliP
 * 
 * Interface d'accès sécurisée à l'application :
 *  * - Formulaire de connexion par numéro de téléphone ou adresse email
 *  * - Redirection automatique selon le rôle (Admin vers /admin, Vendeur vers /seller, etc.)
 *  * - Lien direct vers la création de compte pour les nouveaux utilisateurs
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/authService';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthSplitHero, AuthLoginForm, AuthForgotPasswordForm } from '../components/auth';

interface LoginPageProps {
  initialMode?: 'login' | 'forgot-password';
}

/**
 * Page de connexion sécurisée ReVibe FliP.
 * Architecture modulaire encapsulée dans `components/auth/`.
 */
export const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'login' }) => {
  const { login, isAuthenticated, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isStaff ? '/admin' : '/', { replace: true });
    }
  }, [isAuthenticated, isStaff, navigate]);

  const [mode, setMode] = useState<'login' | 'forgot-password'>(initialMode);
  const [prefilledIdentifier, setPrefilledIdentifier] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (identifier: string, password: string, turnstileToken?: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.login({ identifier, password }, turnstileToken);
      const data = res.data.data;

      if (data.token) {
        login(data.token, data.user);
        const searchParams = new URLSearchParams(location.search);
        const redirectParam = searchParams.get('redirect');
        const from = (location.state as any)?.from?.pathname;

        if (data.user.role === 'ROLE_ADMIN' || data.user.role === 'ROLE_COLLABORATOR') {
          navigate('/admin', { replace: true });
        } else if (redirectParam) {
          navigate(redirectParam, { replace: true });
        } else if (from) {
          navigate(from, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        navigate(`/verify-otp?phone=${encodeURIComponent(identifier)}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants invalides. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      {/* 1. PANNEAU LATÉRAL GAUCHE */}
      <AuthSplitHero
        heading={
          <>
            Accès à <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-orange-400 to-amber-300">
              REVIBE FLIP
            </span>
          </>
        }
        subtitle="Achetez et vendez des vêtements et accessoires de seconde main en toute sécurité."
      />

      {/* 2. FORMULAIRE DE CONNEXION DROITE */}
      <div className="w-full md:w-7/12 flex flex-col justify-between p-6 sm:p-12 lg:p-20 relative">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto my-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {mode === 'login' ? 'Bon retour parmi nous' : 'Mot de passe oublié'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {mode === 'login'
                ? 'Entrez vos identifiants pour vous connecter à votre compte.'
                : 'Réinitialisez votre mot de passe via un code OTP envoyé par SMS.'}
            </p>
          </div>

          {successMessage && mode === 'login' && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === 'login' ? (
            <AuthLoginForm
              initialIdentifier={prefilledIdentifier}
              loading={loading}
              error={error}
              onSubmit={handleLoginSubmit}
              onSwitchToRegister={() => navigate('/register')}
              onForgotPassword={(currentIdentifier) => {
                setError(null);
                setSuccessMessage(null);
                setPrefilledIdentifier(currentIdentifier);
                setMode('forgot-password');
              }}
            />
          ) : (
            <AuthForgotPasswordForm
              initialPhone={prefilledIdentifier}
              onSuccess={(phone) => {
                setPrefilledIdentifier(phone);
                setError(null);
                setSuccessMessage('Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.');
                setMode('login');
              }}
              onBackToLogin={() => {
                setError(null);
                setMode('login');
              }}
            />
          )}
        </div>

        <div className="text-center text-[11px] text-slate-400">
          En vous connectant, vous acceptez les Conditions Générales d'Utilisation de ReVibe FliP.
        </div>
      </div>
    </div>
  );
};
