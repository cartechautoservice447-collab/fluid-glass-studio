-- Prevent collection deletion from deleting notes. Notes are independent records;
-- deleting a collection must only clear their collection_id.
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT con.conname
    INTO fk_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_class ref ON ref.oid = con.confrelid
  WHERE con.contype = 'f'
    AND rel.relname = 'notes'
    AND ref.relname = 'collections'
    AND EXISTS (
      SELECT 1
      FROM unnest(con.conkey) AS k(attnum)
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
      WHERE a.attname = 'collection_id'
    )
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.notes DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

ALTER TABLE public.notes
  ADD CONSTRAINT notes_collection_id_fkey
  FOREIGN KEY (collection_id)
  REFERENCES public.collections(id)
  ON DELETE SET NULL;
