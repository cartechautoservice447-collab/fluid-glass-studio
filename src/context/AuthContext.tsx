import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  getUser,
  sendPasswordReset,
  signIn,
  signOut,
  signUp,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, displayName: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SESSION_KEY = "glass-notes-auth-session-v1";
const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null) {
  try {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // A session still works for the current page if storage is unavailable.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readSession();
    if (!stored) {
      setLoading(false);
      return;
    }

    void getUser(stored.access_token)
      .then((nextUser) => {
        const nextSession = { ...stored, user: nextUser };
        setSession(nextSession);
        setUser(nextUser);
        saveSession(nextSession);
      })
      .catch(() => saveSession(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signInWithPassword(email, password) {
        const nextSession = await signIn(email, password);
        setSession(nextSession);
        setUser(nextSession.user);
        saveSession(nextSession);
      },
      async signUpWithPassword(email, password, displayName) {
        const nextSession = await signUp(email, password, displayName);
        if (!nextSession) return false;
        setSession(nextSession);
        setUser(nextSession.user);
        saveSession(nextSession);
        return true;
      },
      async resetPassword(email) {
        await sendPasswordReset(email);
      },
      async logout() {
        if (session) {
          await signOut(session.access_token).catch(() => undefined);
        }
        setSession(null);
        setUser(null);
        saveSession(null);
      },
    }),
    [loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
