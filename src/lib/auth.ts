export type AuthUser = {
  id: string;
  email: string | null;
  user_metadata?: { display_name?: string };
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: AuthUser;
};

const url = import.meta.env["VITE_SUPABASE_URL"];
const publishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  user: AuthUser;
};

function configured() {
  if (!url || !publishableKey) {
    throw new Error("Authentication is not configured for this deployment yet.");
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  configured();

  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    msg?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(data.error_description ?? data.msg ?? "Authentication request failed.");
  }

  return data;
}

function toSession(result: TokenResponse): AuthSession {
  const expiresAt =
    result.expires_at ??
    (result.expires_in !== undefined ? Math.floor(Date.now() / 1000) + result.expires_in : undefined);

  return {
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    ...(expiresAt !== undefined ? { expires_at: expiresAt } : {}),
    user: result.user,
  };
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const result = await request<TokenResponse>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return toSession(result);
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthSession | null> {
  const result = await request<TokenResponse>("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: { display_name: displayName },
    }),
  });

  if (!result.access_token || !result.refresh_token) return null;

  return toSession(result);
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  const result = await request<TokenResponse>("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  return toSession(result);
}

export async function getUser(accessToken: string): Promise<AuthUser> {
  return request<AuthUser>("/auth/v1/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function signOut(accessToken: string): Promise<void> {
  await request("/auth/v1/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function sendPasswordReset(email: string): Promise<void> {
  await request("/auth/v1/recover", {
    method: "POST",
    body: JSON.stringify({ email, redirect_to: window.location.origin }),
  });
}
