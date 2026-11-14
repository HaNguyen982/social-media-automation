"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  name: string;
  role: string;
  title?: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user || null);
          return;
        }
      }
      setIsAuthenticated(false);
      setUser(null);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (e) {
      console.error("Logout request error:", e);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    logout,
    refreshAuth: checkAuth,
  };
}
