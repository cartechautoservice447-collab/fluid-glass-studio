-- Restore collections and notes as one authenticated transaction.
-- The client may stage multiple restore callbacks in one synchronous import;
-- this function commits the complete batch or rolls the whole batch back.
CREATE OR REPLACE FUNCTION public.restore_course_batch(
  p_course_id uuid,
  p_collections jsonb DEFAULT '[]'::jsonb,
  p_notes jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  item jsonb;
  v_id uuid;
  v_source_id uuid;
  v_collection_id uuid;
  v_name text;
  v_title text;
  v_body text;
  v_favorite boolean;
  v_revision integer;
  v_created_at timestamptz;
  v_updated_at timestamptz;
  v_action text;
  collections_written integer := 0;
  notes_written integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.courses
    WHERE id = p_course_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Course not found or not owned by the current user';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(COALESCE(p_collections, '[]'::jsonb)) LOOP
    v_id := NULLIF(item->>'id', '')::uuid;
    v_name := btrim(COALESCE(item->>'name', ''));
    IF v_id IS NULL OR v_name = '' THEN
      RAISE EXCEPTION 'Invalid collection restore payload';
    END IF;

    INSERT INTO public.collections (id, user_id, course_id, name)
    VALUES (v_id, auth.uid(), p_course_id, v_name)
    ON CONFLICT (id) DO NOTHING;

    IF FOUND THEN collections_written := collections_written + 1; END IF;
  END LOOP;

  FOR item IN SELECT value FROM jsonb_array_elements(COALESCE(p_notes, '[]'::jsonb)) LOOP
    v_id := NULLIF(item->>'id', '')::uuid;
    v_action := COALESCE(item->>'action', 'insert');
    v_source_id := NULLIF(item->>'source_id', '')::uuid;
    v_collection_id := NULLIF(item->>'collection_id', '')::uuid;
    v_title := COALESCE(item->>'title', 'Untitled note');
    v_body := COALESCE(item->>'body', '');
    v_favorite := COALESCE((item->>'favorite')::boolean, false);
    v_revision := COALESCE((item->>'revision')::integer, 0);
    v_created_at := COALESCE((item->>'created_at')::timestamptz, now());
    v_updated_at := COALESCE((item->>'updated_at')::timestamptz, now());

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Invalid note restore payload';
    END IF;

    IF v_collection_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = v_collection_id
        AND course_id = p_course_id
        AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Invalid note collection reference';
    END IF;

    IF v_action = 'update' THEN
      UPDATE public.notes
      SET title = v_title,
          body = v_body,
          favorite = v_favorite,
          collection_id = v_collection_id,
          source_id = v_source_id,
          revision = GREATEST(revision + 1, v_revision),
          updated_at = v_updated_at
      WHERE id = v_id
        AND course_id = p_course_id
        AND user_id = auth.uid();

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Note to update was not found or is not owned by the current user';
      END IF;
      notes_written := notes_written + 1;
    ELSE
      IF v_source_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.notes
        WHERE user_id = auth.uid()
          AND source_id = v_source_id
      ) THEN
        CONTINUE;
      END IF;

      INSERT INTO public.notes (
        id, user_id, course_id, collection_id, title, body,
        favorite, revision, source_id, created_at, updated_at
      )
      VALUES (
        v_id, auth.uid(), p_course_id, v_collection_id, v_title, v_body,
        v_favorite, GREATEST(v_revision, 0), v_source_id, v_created_at, v_updated_at
      )
      ON CONFLICT (id) DO NOTHING;

      IF FOUND THEN notes_written := notes_written + 1; END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'collections_written', collections_written,
    'notes_written', notes_written
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.restore_course_batch(uuid, jsonb, jsonb) TO authenticated;
