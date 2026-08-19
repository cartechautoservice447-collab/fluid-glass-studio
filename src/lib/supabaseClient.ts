import { createClient } from "@supabase/supabase-js";

/**
 * Shared Supabase client for the app's data layer.
 *
 * Auth is managed by AuthContext (src/lib/auth.ts) which stores the session in
 * localStorage. Rather than running a second auth stack, this client reads the
 * access token from that same session on every request, so PostgREST sees the
 * signed-in user and RLS applies as that user.
 */
const SESSION_KEY = "glass-notes-auth-session-v1";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const publishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

type StoredSession = { access_token?: string; user?: { id?: string } };

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return readStoredSession()?.access_token ?? null;
}

export function getSessionUserId(): string | null {
  return readStoredSession()?.user?.id ?? null;
}

function authedFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));

    headers.set("apikey", key);
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    else headers.delete("Authorization");

    return fetch(input, { ...init, headers });
  };
}

export const supabase = createClient(url ?? "http://localhost", publishableKey ?? "anon", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: { fetch: authedFetch(publishableKey ?? "anon") },
});

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
