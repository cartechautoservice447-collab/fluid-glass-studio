-- Security hardening for the Supabase migration.
-- Keep ownership RLS unchanged; restrict policies to authenticated users
-- and make the profile trigger use an immutable empty search_path.

ALTER POLICY "Users manage their own collections" ON public.collections
  TO authenticated;

ALTER POLICY "Users manage their own courses" ON public.courses
  TO authenticated;

ALTER POLICY "Users manage their own notes" ON public.notes
  TO authenticated;

ALTER POLICY "Users manage their own profile" ON public.profiles
  TO authenticated;

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.courses FROM anon;
REVOKE ALL ON public.collections FROM anon;
REVOKE ALL ON public.notes FROM anon;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;
