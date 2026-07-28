"use client";

import { useState, useEffect, useCallback } from "react";
import { apiLogin } from "@/lib/api";

export interface SessionUser {
  id: number;
  name: string;
  role: string;
  token: string;
}

const SESSION_KEY = "work-log-session";

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id && parsed.name) {
          queueMicrotask(() => setUser(parsed));
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (name: string): Promise<SessionUser> => {
    const result = await apiLogin(name);
    const sessionUser: SessionUser = { ...result.employee, token: result.token };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return { user, login, setUser: (u: SessionUser) => { localStorage.setItem(SESSION_KEY, JSON.stringify(u)); setUser(u); }, clearUser: clearSession, isLoading };
}