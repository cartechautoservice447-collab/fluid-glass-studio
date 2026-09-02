-- Persist Study Hub lecture URLs per course so saved lectures can be reopened
-- without repeatedly pasting the same YouTube link.
CREATE TABLE IF NOT EXISTS public.lecture_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled lecture',
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lecture_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_links FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their lecture links" ON public.lecture_links;
CREATE POLICY "Users can view their lecture links"
  ON public.lecture_links FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their lecture links" ON public.lecture_links;
CREATE POLICY "Users can insert their lecture links"
  ON public.lecture_links FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their lecture links" ON public.lecture_links;
CREATE POLICY "Users can update their lecture links"
  ON public.lecture_links FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their lecture links" ON public.lecture_links;
CREATE POLICY "Users can delete their lecture links"
  ON public.lecture_links FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON public.lecture_links FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lecture_links TO authenticated;
GRANT ALL ON public.lecture_links TO service_role;

-- The URL is canonicalized client-side before writes, so this makes saving
-- the same lecture idempotent even when the user clicks Save more than once.
CREATE UNIQUE INDEX IF NOT EXISTS lecture_links_user_course_url_idx
  ON public.lecture_links (user_id, course_id, url);

CREATE INDEX IF NOT EXISTS lecture_links_user_course_updated_idx
  ON public.lecture_links (user_id, course_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_lecture_links_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lecture_links_set_updated_at ON public.lecture_links;
CREATE TRIGGER lecture_links_set_updated_at
  BEFORE UPDATE ON public.lecture_links
  FOR EACH ROW EXECUTE FUNCTION public.set_lecture_links_updated_at();
