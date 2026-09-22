import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CustomizationProvider } from "@/context/CustomizationContext";
import { LiquidFilters } from "@/components/liquid/LiquidFilters";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Confirming your account — Glass Notes" },
      { name: "description", content: "Finishing your secure Glass Notes sign-in." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AuthProvider>
      <CustomizationProvider>
        <LiquidFilters />
        <AuthCallbackScreen />
      </CustomizationProvider>
    </AuthProvider>
  );
}

function AuthCallbackScreen() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let redirected = false;

    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && active) setError(exchangeError.message);
        if (exchangeError) return;
      }

      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const authError = hash.get("error_description") || hash.get("error");
      if (authError && active) setError(authError);
    };

    void finish();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || redirected) return;
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
        redirected = true;
        void navigate({ to: "/", replace: true });
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!loading && user && !error) void navigate({ to: "/", replace: true });
  }, [error, loading, navigate, user]);

  return (
    <main className="liquid-stage relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07070c] px-5 py-8">
      <div className="liquid-orb liquid-orb-a" aria-hidden />
      <div className="liquid-orb liquid-orb-b" aria-hidden />
      <div className="liquid-orb liquid-orb-c" aria-hidden />
      <section className="liquid-panel relative w-full max-w-md rounded-[2rem] p-8 text-center">
        {error ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">We couldn't finish verification</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => void navigate({ to: "/", replace: true })}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300"
            >
              Back to sign in
            </button>
          </>
        ) : user ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300">
              <ShieldCheck className="size-6" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Email confirmed</h1>
            <p className="text-sm text-muted-foreground">Opening your workspace…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="size-6 animate-spin text-sky-200" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Confirming your account…</h1>
            <p className="text-sm text-muted-foreground">Please wait while we finish your secure sign-in.</p>
          </div>
        )}
      </section>
    </main>
  );
}
