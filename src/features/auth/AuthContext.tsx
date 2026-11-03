import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { saveTokens } from "@/lib/api";
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
    saveTokens(null);
    setUser(null);
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
