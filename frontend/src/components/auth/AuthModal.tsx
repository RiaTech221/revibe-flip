/**
 * Composant d'Authentification : AuthModal
 * 
 * Gère une sous-partie du processus d'inscription, connexion ou vérification OTP (AuthModal).
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authService';
import { X } from 'lucide-react';
import { Logo } from '../Logo';
import { AuthLoginForm } from './AuthLoginForm';
import { AuthRegisterForm } from './AuthRegisterForm';
import { AuthOtpForm } from './AuthOtpForm';

/**
 * Modale d'authentification universelle (Connexion, Inscription, OTP).
 * Orchestrée en sous-composants spécialisés avec fermeture fluide.
 */
export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, pendingPhone, closeAuthModal, login, openAuthModal } =
    useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'otp'>(authModalMode);
  const [phoneForOtp, setPhoneForOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(authModalMode);
    if (pendingPhone) {
      setPhoneForOtp(pendingPhone);
    }
  }, [authModalMode, pendingPhone]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (identifier: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ identifier, password });
      const data = res.data.data;
      if (data.token) {
        login(data.token, data.user);
        closeAuthModal();
      } else if (data.otpDemoCode) {
        setPhoneForOtp(identifier);
        setDemoOtp(data.otpDemoCode);
        setMode('otp');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (formData: any) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.register(formData);
      setPhoneForOtp(formData.phone);
      setDemoOtp(res.data.data?.otpDemoCode || null);
      setMode('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (otpCode: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ phone: phoneForOtp, otpCode });
      const data = res.data.data;
      login(data.token, data.user);
      closeAuthModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code OTP invalide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-150 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Fermer */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="md" />
          <h2 className="text-xl font-black text-slate-900 mt-3">
            {mode === 'login' && 'Connexion'}
            {mode === 'register' && 'Créer un compte'}
            {mode === 'otp' && 'Vérification de sécurité'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'login' && 'Accédez à vos commandes et discussions'}
            {mode === 'register' && 'Rejoignez la communauté de seconde main'}
            {mode === 'otp' && 'Confirmez votre identité par SMS'}
          </p>
        </div>

        {/* Contenu selon le mode */}
        {mode === 'login' && (
          <AuthLoginForm
            initialIdentifier={phoneForOtp}
            loading={loading}
            error={error}
            onSubmit={handleLoginSubmit}
            onSwitchToRegister={() => {
              setError(null);
              setMode('register');
            }}
          />
        )}

        {mode === 'register' && (
          <AuthRegisterForm
            loading={loading}
            error={error}
            onSubmit={handleRegisterSubmit}
            onSwitchToLogin={() => {
              setError(null);
              setMode('login');
            }}
          />
        )}

        {mode === 'otp' && (
          <AuthOtpForm
            phone={phoneForOtp}
            demoOtpCode={demoOtp}
            loading={loading}
            error={error}
            onSubmit={handleOtpSubmit}
            onBack={() => {
              setError(null);
              setMode('login');
            }}
          />
        )}
      </div>
    </div>
  );
};
