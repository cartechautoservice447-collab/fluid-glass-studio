-- Account/cloud preference support for the existing profile model.
-- Do not expose or modify service-role credentials here.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pure_black boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS performance_mode text NOT NULL DEFAULT 'high';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_performance_mode_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_performance_mode_check
  CHECK (performance_mode IN ('high', 'ultra'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS source_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS notes_source_unique_idx
  ON public.notes (user_id, source_id)
  WHERE source_id IS NOT NULL;

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Migration bookkeeping is intentionally local/user-scoped in the client because
-- legacy localStorage belongs to the browser and cannot be safely interpreted by
-- another account. Runtime cloud data remains protected by RLS.
