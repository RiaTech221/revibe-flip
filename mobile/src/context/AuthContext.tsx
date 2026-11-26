/**
 * Contexte d'Authentification Mobile ReVibe FliP
 * 
 * Gère l'état global de session utilisateur sur smartphone :
 *  * - Stockage et propagation de l'utilisateur connecté (User) et du token JWT
 *  * - Fonctions de login, logout et refreshProfile
 *  * - Synchronisation immédiate du token avec le client HTTP Axios (setAuthToken)
 */

import React, { createContext, useContext, useState } from 'react';
import { getRefreshToken, setAuthToken, setRefreshToken } from '../api';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, refreshToken?: string | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (newToken: string, newUser: User, newRefreshToken?: string | null) => {
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
    if (newRefreshToken !== undefined) {
      setRefreshToken(newRefreshToken);
    }
  };

  const logout = async () => {
    const currentRefreshToken = getRefreshToken();
    try {
      await authService.logout(currentRefreshToken);
    } catch {
      // Toujours purger l'état local même si le réseau ou le jeton a expiré
    } finally {
      setToken(null);
      setUser(null);
      setAuthToken(null);
      setRefreshToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
