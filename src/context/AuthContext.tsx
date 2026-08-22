import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export type AuthUser = {
  id: string;
  email: string | null;
  user_metadata?: { display_name?: string } | undefined;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, displayName: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(
        nextUser
          ? {
              id: nextUser.id,
              email: nextUser.email ?? null,
              user_metadata: nextUser.user_metadata as { display_name?: string } | undefined,
            }
          : null,
      );
      setLoading(false);
    });

    void supabase.auth.getSession().then(({ data }) => {
      const nextUser = data.session?.user ?? null;
      if (nextUser) {
        setUser({
          id: nextUser.id,
          email: nextUser.email ?? null,
          user_metadata: nextUser.user_metadata as { display_name?: string } | undefined,
        });
      }
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
      },
      async signUpWithPassword(email, password, displayName) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw new Error(error.message);
        return Boolean(data.session);
      },
      async signInWithGoogle() {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if ("error" in result && result.error) throw new Error(result.error.message);
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw new Error(error.message);
      },
      async logout() {
        await supabase.auth.signOut();
        setUser(null);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
