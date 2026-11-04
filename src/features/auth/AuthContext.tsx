import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, loadTokens, saveTokens, SESSION_EXPIRED_EVENT } from "@/lib/api";
import { env } from "@/lib/env";
import { authApi } from "./api/authApi";
import type { CurrentUser, UserRole } from "./types";

const SESSION_KEY = "luminabox.session";

interface AuthValue {
  user: CurrentUser | null;
  hasRole: (...roles: UserRole[]) => boolean;
  setUser: (user: CurrentUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function loadUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<CurrentUser | null>(loadUser);

  const setUser = useCallback((next: CurrentUser | null) => {
    setUserState(next);
    try {
      if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      return;
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => undefined).finally(() => saveTokens(null));
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    if (env.useMock) return;

    if (!loadTokens()) {
      setUser(null);
      return;
    }

    authApi.me().then(setUser).catch((error) => {
      if (error instanceof ApiError && error.status === 401) setUser(null);
    });
  }, [setUser]);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [setUser]);

  const value = useMemo<AuthValue>(
    () => ({ user, setUser, logout, hasRole: (...roles) => !!user && roles.includes(user.role) }),
    [user, setUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
