"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, setAuthToken, removeAuthToken, getAuthToken } from "./api";

export interface User {
  id: string;
  full_name: string;
  artist_name?: string;
  email?: string;
  phone_number: string;
  role: "artist" | "organizer" | "painter" | "fan" | "admin" | "bcda_agent";
  wallet_balance_fcfa: string | number;
  avatar_url?: string;
  bio?: string;
  momo_number?: string;
  airtel_number?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isError: Error | null;
  login: (credentials: { identifier: string; password: string }) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<Error | null>(null);

  const refreshProfile = async (): Promise<boolean> => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return false;
      }
      const res = await authApi.getProfile();
      if (res.user) {
        setUser(res.user);
        if (typeof window !== "undefined") {
          localStorage.setItem("moyo_user", JSON.stringify(res.user));
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Erreur chargement profil :", error);
      removeAuthToken();
      setUser(null);
      setIsError(error instanceof Error ? error : new Error("Erreur chargement profil"));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Vérifier si un profil sauvegardé existe
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("moyo_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsLoading(false); // Charger depuis localStorage ⇒ plus de loading
        } catch (e) {
          // Donnée corrompue : on l'efface pour ne pas re-échouer à chaque chargement.
          console.warn("Profil local invalide, suppression :", e);
          localStorage.removeItem("moyo_user");
        }
      }
    }
    refreshProfile();
  }, []);

  const login = async (credentials: { identifier: string; password: string }): Promise<boolean> => {
    setIsError(null);
    try {
      const res = await authApi.login(credentials);
      if (res.token && res.user) {
        setAuthToken(res.token);
        setUser(res.user);
        if (typeof window !== "undefined") {
          localStorage.setItem("moyo_user", JSON.stringify(res.user));
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Erreur login :", error);
      setIsError(error instanceof Error ? error : new Error(error.message || "Erreur de connexion"));
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    setIsError(null);
    try {
      const res = await authApi.register(userData);
      if (res.token && res.user) {
        setAuthToken(res.token);
        setUser(res.user);
        if (typeof window !== "undefined") {
          localStorage.setItem("moyo_user", JSON.stringify(res.user));
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Erreur inscription :", error);
      setIsError(error instanceof Error ? error : new Error(error.message || "Erreur lors de l'inscription"));
      return false;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setIsError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isError, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé au sein d'un AuthProvider");
  }
  return context;
}
