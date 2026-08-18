import { ArrowLeft, CheckCircle2, LockKeyhole, Mail, User } from "lucide-react";
import { useEffect, useState } from "react";

import { GlassPanel } from "@/components/liquid/GlassPanel";
import { useAuth } from "@/context/AuthContext";

type Mode = "signin" | "signup" | "forgot";

export function AuthScreen() {
  const { signIn, signUp, resetPassword, error, clearError } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    clearError();
    setSuccess(null);
    setPassword("");
  }, [mode, clearError]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setSuccess(null);
    setBusy(true);

    try {
      if (mode === "signin") {
        if (await signIn(email, password)) setSuccess("Signed in successfully.");
        return;
      }

      if (mode === "signup") {
        if (!displayName.trim() || password.length < 6) return;
        const result = await signUp(email, password, displayName);
        if (result === "signed-in") setSuccess("Account created successfully.");
        if (result === "check-email") setSuccess("Account created. Check your email to confirm your address.");
        return;
      }

      if (await resetPassword(email)) {
        setSuccess("Password reset instructions have been sent to your email.");
      }
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your workspace" : "Reset your password";
  const subtitle = mode === "signin"
    ? "Sign in to continue to your Glass Notes courses."
    : mode === "signup"
      ? "Create an account and start building your course notes."
      : "Enter your email and we'll send you reset instructions.";

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#07070c]">
      <div className="liquid-stage relative flex h-full w-full items-center justify-center overflow-hidden px-5 py-6">
        <div className="liquid-orb liquid-orb-a" aria-hidden />
        <div className="liquid-orb liquid-orb-b" aria-hidden />
        <div className="liquid-orb liquid-orb-c" aria-hidden />

        <GlassPanel className="relative z-10 w-full max-w-md !p-7 sm:!p-8">
          <div className="mb-7">
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/10">
              <LockKeyhole className="size-5 text-white" />
            </div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.3em] on-stage-muted">Glass Notes</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{subtitle}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/75">Display name</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" placeholder="Your name" disabled={busy} className="h-11 w-full rounded-xl border border-white/15 bg-white/8 pl-10 pr-3 text-sm text-white outline-none transition focus:border-white/35 focus:bg-white/12" />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/75">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" disabled={busy} className="h-11 w-full rounded-xl border border-white/15 bg-white/8 pl-10 pr-3 text-sm text-white outline-none transition focus:border-white/35 focus:bg-white/12" />
              </div>
            </label>

            {mode !== "forgot" && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/75">Password</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} placeholder="••••••••" disabled={busy} className="h-11 w-full rounded-xl border border-white/15 bg-white/8 pl-10 pr-3 text-sm text-white outline-none transition focus:border-white/35 focus:bg-white/12" />
                </div>
              </label>
            )}

            {mode === "signup" && <p className="text-xs text-white/45">Use at least 6 characters for your password.</p>}
            {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-xs leading-relaxed text-red-100">{error}</div>}
            {success && <div className="flex gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-xs leading-relaxed text-emerald-100"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><span>{success}</span></div>}

            <button
              type="submit"
              disabled={busy || !email.trim() || (mode === "signin" && !password) || (mode === "signup" && (!displayName.trim() || password.length < 6))}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Please wait..." : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset email"}
            </button>
          </form>

          <div className="mt-6 text-center">
            {mode === "signin" && (
              <>
                <button type="button" onClick={() => setMode("forgot")} className="text-xs text-white/60 transition hover:text-white">Forgot password?</button>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-xs text-white/45">Don't have an account?</p>
                  <button type="button" onClick={() => setMode("signup")} className="mt-1 text-sm font-semibold text-white transition hover:text-emerald-300">Create one</button>
                </div>
              </>
            )}
            {mode !== "signin" && (
              <button type="button" onClick={() => setMode("signin")} className="inline-flex items-center gap-1.5 text-sm font-medium text-white/65 transition hover:text-white">
                <ArrowLeft className="size-3.5" />
                Back to sign in
              </button>
            )}
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
