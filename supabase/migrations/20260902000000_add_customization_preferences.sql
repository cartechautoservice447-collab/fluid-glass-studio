-- Persist the new background controls and normal UI text clarity in the account profile.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS background_theme_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_opacity numeric NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS full_dark_background boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ui_text_clarity text NOT NULL DEFAULT 'default';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_ui_text_clarity_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_ui_text_clarity_check
  CHECK (ui_text_clarity IN ('default', 'smooth', 'medium', 'punchy'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_background_opacity_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_background_opacity_check
  CHECK (background_opacity >= 0 AND background_opacity <= 100);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
