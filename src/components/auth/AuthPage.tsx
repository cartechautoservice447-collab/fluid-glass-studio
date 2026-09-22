import { ArrowLeft, KeyRound, Loader2, Mail, Sparkles, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/context/AuthContext";

type Mode = "sign-in" | "sign-up" | "reset";

const inputClass =
  "h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/20";

export function AuthPage() {
  const { signInWithPassword, signUpWithPassword, resendConfirmation, resetPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const isReset = mode === "reset";
  const isSignUp = mode === "sign-up";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (isSignUp && password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setSubmitting(true);
    try {
      if (isReset) {
        await resetPassword(email);
        setMessage("If an account exists for this email, a reset link is on its way.");
      } else if (isSignUp) {
        const signedIn = await signUpWithPassword(email, password, name.trim());
        if (!signedIn) {
          setMessage("Account created. Check your email to confirm it, then sign in.");
          setMode("sign-in");
        }
      } else {
        await signInWithPassword(email, password);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setError("");
    setMessage("");
    setResending(true);
    try {
      await resendConfirmation(email);
      setMessage("A new confirmation email has been sent. Open the newest link and finish verification.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't resend the confirmation email. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setMessage("");
    setPassword("");
  };

  const continueWithGoogle = async () => {
    setError("");
    setMessage("");
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google sign-in is unavailable.");
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <main className="liquid-stage relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07070c] px-5 py-8">
      <div className="liquid-orb liquid-orb-a" aria-hidden />
      <div className="liquid-orb liquid-orb-b" aria-hidden />
      <div className="liquid-orb liquid-orb-c" aria-hidden />

      <section className="liquid-panel relative w-full max-w-md rounded-[2rem] p-7 sm:p-9">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-violet-500 text-slate-950 shadow-lg shadow-violet-500/30">
            <Sparkles className="size-7" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-200/80">Glass Notes</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {isReset ? "Reset your password" : isSignUp ? "Create your workspace" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isReset
              ? "We’ll email you a secure reset link."
              : "Your notes, courses and engine settings sync to your account."}
          </p>
        </div>

        {!isReset && (
          <>
            <button
              type="button"
              onClick={() => void continueWithGoogle()}
              disabled={googleBusy}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-foreground transition hover:bg-white/15 disabled:opacity-70"
            >
              {googleBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#4285F4]">
                  G
                </span>
              )}
              Continue with Google
            </button>
            <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="h-px flex-1 bg-white/10" />
              <span>or</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </>
        )}

        <form className="space-y-4" onSubmit={submit}>
          {isSignUp && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Name</span>
              <span className="relative block">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                />
              </span>
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </span>
          </label>

          {!isReset && (
            <label className="block space-y-1.5">
              <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                Password
                {!isSignUp && (
                  <button type="button" onClick={() => switchMode("reset")} className="text-sky-200">
                    Forgot password?
                  </button>
                )}
              </span>
              <span className="relative block">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isSignUp ? "At least 8 characters" : "Your password"}
                  className={inputClass}
                />
              </span>
            </label>
          )}

          {error && (
            <div className="space-y-2">
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>
              {!isReset && email.trim() && (
                <button
                  type="button"
                  onClick={() => void resend()}
                  disabled={resending}
                  className="text-xs font-medium text-sky-200 underline-offset-2 hover:underline disabled:opacity-60"
                >
                  {resending ? "Sending confirmation email…" : "Resend confirmation email"}
                </button>
              )}
            </div>
          )}
          {message && (
            <div className="space-y-2">
              <p className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                {message}
              </p>
              {!isReset && (message.includes("Check your email") || message.includes("confirmation email")) && (
                <button
                  type="button"
                  onClick={() => void resend()}
                  disabled={resending}
                  className="text-xs font-medium text-sky-200 underline-offset-2 hover:underline disabled:opacity-60"
                >
                  {resending ? "Sending confirmation email…" : "Resend confirmation email"}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-70"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isReset ? "Send reset link" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isReset ? (
            <button
              type="button"
              onClick={() => switchMode("sign-in")}
              className="inline-flex items-center gap-1 text-sky-200"
            >
              <ArrowLeft className="size-3.5" /> Back to sign in
            </button>
          ) : isSignUp ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => switchMode("sign-in")} className="font-medium text-sky-200">
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button type="button" onClick={() => switchMode("sign-up")} className="font-medium text-sky-200">
                Create an account
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
