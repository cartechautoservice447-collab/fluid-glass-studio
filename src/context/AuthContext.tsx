import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getUser,
  refreshSession,
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
const REFRESH_LEEWAY_SECONDS = 60;
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

function sessionNeedsRefresh(session: AuthSession) {
  return (
    typeof session.expires_at === "number" &&
    session.expires_at * 1000 <= Date.now() + REFRESH_LEEWAY_SECONDS * 1000
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((nextSession: AuthSession) => {
    setSession(nextSession);
    setUser(nextSession.user);
    saveSession(nextSession);
  }, []);

  const refreshCurrentSession = useCallback(async () => {
    if (!session?.refresh_token) return;

    try {
      const nextSession = await refreshSession(session.refresh_token);
      applySession(nextSession);
    } catch {
      setSession(null);
      setUser(null);
      saveSession(null);
    }
  }, [applySession, session?.refresh_token]);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const stored = readSession();

      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        let nextSession = stored;

        if (sessionNeedsRefresh(stored)) {
          nextSession = await refreshSession(stored.refresh_token);
        }

        const nextUser = await getUser(nextSession.access_token);

        if (cancelled) return;

        applySession({
          ...nextSession,
          user: nextUser,
        });
      } catch {
        if (!cancelled) {
          setSession(null);
          setUser(null);
        }
        saveSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  useEffect(() => {
    if (!session?.expires_at) return;

    const delay = Math.max(
      5000,
      session.expires_at * 1000 - Date.now() - REFRESH_LEEWAY_SECONDS * 1000,
    );

    const timer = window.setTimeout(() => {
      void refreshCurrentSession();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [refreshCurrentSession, session?.expires_at]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signInWithPassword(email, password) {
        const nextSession = await signIn(email, password);
        applySession(nextSession);
      },
      async signUpWithPassword(email, password, displayName) {
        const nextSession = await signUp(email, password, displayName);
        if (!nextSession) return false;
        applySession(nextSession);
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
    [applySession, loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
