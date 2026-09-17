import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { GlassPanel } from "@/components/liquid/GlassPanel";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CustomizationProvider } from "@/context/CustomizationContext";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Glass Notes" },
      { name: "description", content: "Set a new password for your Glass Notes account." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AuthProvider>
      <CustomizationProvider>
        <ResetPasswordScreen />
      </CustomizationProvider>
    </AuthProvider>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/20 bg-transparent pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/20";

function ResetPasswordScreen() {
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
      window.setTimeout(() => void navigate({ to: "/" }), 1800);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent px-5 py-8">
      <GlassPanel glassId="reset-password-shell" className="relative w-full max-w-md p-7 sm:p-9" glassRadius={32} glassBezel={48}>
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center"><Loader2 className="size-6 animate-spin text-sky-200" /><p className="text-sm text-muted-foreground">Verifying your reset link…</p></div>
        ) : !user ? (
          <div className="text-center"><h1 className="text-xl font-semibold tracking-tight text-foreground">This link is invalid or has expired</h1><p className="mt-2 text-sm text-muted-foreground">Password reset links only work once and expire after a short time. Request a new one from the sign-in screen.</p><Link to="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300">Back to sign in</Link></div>
        ) : done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center"><span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300"><ShieldCheck className="size-6" /></span><h1 className="text-xl font-semibold tracking-tight text-foreground">Password updated</h1><p className="text-sm text-muted-foreground">Taking you to your workspace…</p></div>
        ) : (
          <>
            <div className="mb-8 text-center"><h1 className="text-2xl font-semibold tracking-tight text-foreground">Set a new password</h1><p className="mt-2 text-sm text-muted-foreground">Choose a new password for your account.</p></div>
            <form className="space-y-4" onSubmit={submit}>
              <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">New password</span><span className="relative block"><KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input required type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className={inputClass} /></span></label>
              <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Confirm password</span><span className="relative block"><KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input required type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Type it again" className={inputClass} /></span></label>
              {error && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}
              <button type="submit" disabled={submitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-70">{submitting && <Loader2 className="size-4 animate-spin" />}Update password</button>
            </form>
          </>
        )}
      </GlassPanel>
    </main>
  );
}
