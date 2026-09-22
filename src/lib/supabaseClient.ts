/**
 * Shared Supabase client for the app's data layer.
 *
 * Auth is managed by the generated Supabase client (email/password + Google via
 * the Lovable OAuth broker), so the same client already carries the signed-in
 * user's session and RLS applies as that user.
 */
import { supabase } from "@/integrations/supabase/client";

export { supabase };

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
