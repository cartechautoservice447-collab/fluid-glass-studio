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
  sendPasswordReset,
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth";

const STORAGE_KEY = "glass-notes-auth-session-v1";

type AuthContextValue = {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, displayName: string) => Promise<"signed-in" | "check-email" | "error">;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function authError(error: unknown) {
  if (!(error instanceof Error)) return "Authentication failed. Please try again.";
  const message = error.message.toLowerCase();
  if (message.includes("invalid login credentials")) return "Incorrect email or password.";
  if (message.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (message.includes("already registered")) return "An account with this email already exists.";
  return error.message || "Authentication failed. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const stored = loadSession();
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const currentUser = await getUser(stored.access_token);
        if (cancelled) return;
        const restored = { ...stored, user: currentUser };
        setSession(restored);
        setUser(currentUser);
        saveSession(restored);
      } catch {
        saveSession(null);
        if (!cancelled) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const next = await authSignIn(email.trim(), password);
      setSession(next);
      setUser(next.user);
      saveSession(next);
      return true;
    } catch (err) {
      setError(authError(err));
      return false;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setError(null);
    try {
      const next = await authSignUp(email.trim(), password, displayName.trim());
      if (!next) return "check-email" as const;
      setSession(next);
      setUser(next.user);
      saveSession(next);
      return "signed-in" as const;
    } catch (err) {
      setError(authError(err));
      return "error" as const;
    }
  }, []);

  const signOut = useCallback(async () => {
    const current = session;
    setError(null);
    try {
      if (current) await authSignOut(current.access_token);
    } catch {
      // Local sign-out still succeeds if the remote session is already invalid.
    } finally {
      setSession(null);
      setUser(null);
      saveSession(null);
    }
  }, [session]);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await sendPasswordReset(email.trim());
      return true;
    } catch (err) {
      setError(authError(err));
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      resetPassword,
      clearError: () => setError(null),
    }),
    [user, session, loading, error, signIn, signUp, signOut, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
