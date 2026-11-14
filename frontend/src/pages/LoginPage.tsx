/**
 * Page de Connexion ReVibe FliP
 * 
 * Interface d'accès sécurisée à l'application :
 *  * - Formulaire de connexion par numéro de téléphone ou adresse email
 *  * - Redirection automatique selon le rôle (Admin vers /admin, Vendeur vers /seller, etc.)
 *  * - Lien direct vers la création de compte pour les nouveaux utilisateurs
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/authService';
import { ArrowLeft } from 'lucide-react';
import { AuthSplitHero, AuthLoginForm } from '../components/auth';

/**
 * Page de connexion sécurisée ReVibe FliP.
 * Architecture modulaire encapsulée dans `components/auth/`.
 */
export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (identifier: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.login({ identifier, password });
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
        } else {
          navigate('/');
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
              Bon retour parmi nous
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Entrez vos identifiants pour vous connecter à votre compte.
            </p>
          </div>

          <AuthLoginForm
            loading={loading}
            error={error}
            onSubmit={handleLoginSubmit}
            onSwitchToRegister={() => navigate('/register')}
          />
        </div>

        <div className="text-center text-[11px] text-slate-400">
          En vous connectant, vous acceptez les Conditions Générales d'Utilisation de ReVibe FliP.
        </div>
      </div>
    </div>
  );
};
