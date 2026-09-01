ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pure_black boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.restore_course_batch(p_course_id uuid, p_collections jsonb, p_notes jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE c jsonb; n jsonb;
BEGIN
  FOR c IN SELECT * FROM jsonb_array_elements(coalesce(p_collections, '[]'::jsonb)) LOOP
    INSERT INTO public.collections (id, user_id, course_id, name)
    VALUES ((c->>'id')::uuid, auth.uid(), p_course_id, coalesce(c->>'name',''))
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  FOR n IN SELECT * FROM jsonb_array_elements(coalesce(p_notes, '[]'::jsonb)) LOOP
    IF (n->>'action') = 'update' THEN
      UPDATE public.notes SET
        title = coalesce(n->>'title', title),
        body = coalesce(n->>'body', body),
        favorite = coalesce((n->>'favorite')::boolean, favorite),
        collection_id = nullif(n->>'collection_id','')::uuid,
        source_id = nullif(n->>'source_id','')::uuid,
        revision = revision + 1,
        updated_at = now()
      WHERE id = (n->>'id')::uuid AND course_id = p_course_id;
    ELSE
      INSERT INTO public.notes (id, user_id, course_id, title, body, favorite, collection_id, source_id, revision, created_at, updated_at)
      VALUES ((n->>'id')::uuid, auth.uid(), p_course_id, coalesce(n->>'title','Untitled note'), coalesce(n->>'body',''),
              coalesce((n->>'favorite')::boolean,false), nullif(n->>'collection_id','')::uuid, nullif(n->>'source_id','')::uuid,
              0, coalesce((n->>'created_at')::timestamptz, now()), coalesce((n->>'updated_at')::timestamptz, now()))
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_course_batch(uuid, jsonb, jsonb) TO authenticated;