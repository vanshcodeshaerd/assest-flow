"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import type { AuthUser } from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // Refresh 14 minutes before expiration (15 min total)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get("/api/auth/me");
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/login", { identifier, password });
      
      if (response.data.success) {
        setUser(response.data.user);
        
        // Store access token in memory (or localStorage if needed)
        // For this implementation, we'll use cookies set by the server
        
        // Redirect based on role
        const redirectUrl = response.data.redirect || "/dashboard";
        router.push(redirectUrl);
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  }, [router]);

  // Logout function
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await axios.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setLoading(false);
      router.push("/login");
    }
  }, [router]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const response = await axios.post("/api/auth/refresh");
      
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        // If refresh fails, logout
        await logout();
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      await logout();
    }
  }, [logout]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshToken();
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken]);

  // Fetch current user on mount
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      refreshToken,
    }),
    [user, loading, isAuthenticated, login, logout, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
