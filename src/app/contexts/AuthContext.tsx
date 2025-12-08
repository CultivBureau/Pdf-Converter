"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  isAuthenticated as checkAuthenticated,
  type User,
  type LoginRequest,
} from "../services/AuthApi";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === "admin";

  // Fetch current user if token exists
  const refreshUser = useCallback(async () => {
    if (!checkAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
      setError(err instanceof Error ? err.message : "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiLogin(credentials);
      setUser(response.user);
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiLogout();
      setUser(null);
      setError(null);
      router.push("/pages/Login");
    } catch (err) {
      console.error("Logout error:", err);
      // Still clear user state even if API call fails
      setUser(null);
      router.push("/pages/Login");
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    error,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook that requires authentication (redirects to login if not authenticated)
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.push("/pages/Login?returnUrl=" + encodeURIComponent(window.location.pathname));
    }
  }, [auth.isAuthenticated, auth.loading, router]);

  return auth;
}

// Hook that requires admin role (redirects to home if not admin)
export function useRequireAdmin() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading) {
      if (!auth.isAuthenticated) {
        router.push("/pages/Login?returnUrl=" + encodeURIComponent(window.location.pathname));
      } else if (!auth.isAdmin) {
        router.push("/?error=unauthorized");
      }
    }
  }, [auth.isAuthenticated, auth.isAdmin, auth.loading, router]);

  return auth;
}

