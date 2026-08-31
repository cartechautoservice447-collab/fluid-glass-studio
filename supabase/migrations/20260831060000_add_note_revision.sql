ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 0;

UPDATE public.notes
SET revision = 0
WHERE revision IS NULL;

ALTER TABLE public.notes
  ALTER COLUMN revision SET DEFAULT 0,
  ALTER COLUMN revision SET NOT NULL;
