/**
 * Page d'Inscription Utilisateur ReVibe FliP
 * 
 * Formulaire d'ouverture de compte sur la marketplace :
 *  * - Sélection du pays d'Afrique de l'Ouest/Centrale avec indicatif téléphonique
 *  * - Saisie des informations de base et mot de passe sécurisé
 *  * - Étape de vérification par code OTP (SMS)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/authService';
import { ArrowLeft } from 'lucide-react';
import { AuthSplitHero, AuthRegisterForm, AuthOtpForm } from '../components/auth';

/**
 * Page d'inscription et de vérification OTP ReVibe FliP.
 * Architecture modulaire encapsulée dans `components/auth/`.
 */
export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isOtpStep, setIsOtpStep] = useState(false);
  const [phoneForOtp, setPhoneForOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegisterSubmit = async (formData: any) => {
    setError(null);
    setLoading(true);

    try {
      await authApi.register(formData);
      setPhoneForOtp(formData.phone);
      setIsOtpStep(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (otpCode: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.verifyOtp({ phone: phoneForOtp, otpCode });
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
      {/* 1. PANNEAU LATÉRAL GAUCHE */}
      <AuthSplitHero
        heading={
          <>
            Rejoignez <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-orange-400 to-amber-300">
              REVIBE FLIP
            </span>
          </>
        }
        subtitle="Créez votre compte en quelques secondes et commencez à vendre ou acheter des articles de qualité."
      />

      {/* 2. FORMULAIRE D'INSCRIPTION / OTP DROITE */}
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
          {!isOtpStep ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Créer un compte
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Rejoignez la plus grande marketplace circulaire en Afrique de l'Ouest.
                </p>
              </div>

              <AuthRegisterForm
                loading={loading}
                error={error}
                onSubmit={handleRegisterSubmit}
                onSwitchToLogin={() => navigate('/login')}
              />
            </>
          ) : (
            <AuthOtpForm
              phone={phoneForOtp}
              loading={loading}
              error={error}
              onSubmit={handleVerifyOtpSubmit}
              onBack={() => setIsOtpStep(false)}
            />
          )}
        </div>

        <div className="text-center text-[11px] text-slate-400">
          En créant un compte, vous acceptez nos Conditions Générales et notre Politique de Confidentialité.
        </div>
      </div>
    </div>
  );
};
