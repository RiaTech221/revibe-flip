/**
 * Contexte d'Authentification Global ReVibe FliP
 * 
 * Fournit l'état d'authentification à l'ensemble de l'arborescence React :
 *  * - Utilisateur actuellement connecté (User) et son statut (rôles, vérification, pays)
 *  * - Fonctions de login, logout, rechargement du profil et modal de connexion
 *  * - Persistance du token JWT dans le stockage local (localStorage)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { setAccessToken } from '../services/httpClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'otp';
  pendingPhone: string;
  openAuthModal: (mode?: 'login' | 'register' | 'otp', phone?: string) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'otp'>('login');
  const [pendingPhone, setPendingPhone] = useState('');

  const refreshUser = async () => {
    try {
      const refreshRes = await authApi.refresh();
      const newToken = refreshRes.data?.data?.token;
      const refreshedUser = refreshRes.data?.data?.user;
      if (newToken && refreshedUser) {
        setAccessToken(newToken);
        setToken(newToken);
        setUser(refreshedUser);
        return;
      }
      const res = await authApi.getMe();
      if (res.data && res.data.data) {
        setUser(res.data.data);
      }
    } catch {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setAccessToken(newToken);
    setToken(newToken);
    setUser(newUser);
    closeAuthModal();
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setAccessToken(null);
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (mode: 'login' | 'register' | 'otp' = 'login', phone = '') => {
    setAuthModalMode(mode);
    setPendingPhone(phone);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        logout,
        refreshUser,
        isAuthModalOpen,
        authModalMode,
        pendingPhone,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
