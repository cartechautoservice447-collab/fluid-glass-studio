ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS liquid_density numeric NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS liquid_transparency numeric NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS liquid_clearness numeric NOT NULL DEFAULT 35,
  ADD COLUMN IF NOT EXISTS liquid_gel numeric NOT NULL DEFAULT 55,
  ADD COLUMN IF NOT EXISTS liquid_bounce_stiffness numeric NOT NULL DEFAULT 260,
  ADD COLUMN IF NOT EXISTS liquid_bounce_damping numeric NOT NULL DEFAULT 18;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;