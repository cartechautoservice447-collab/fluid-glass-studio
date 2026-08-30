-- Prevent exact logical duplicate notes at the database layer.
-- Existing duplicates are cleaned before this index is applied.
create unique index if not exists notes_logical_unique_idx
  on public.notes (
    user_id,
    course_id,
    coalesce(title, 'Untitled note'),
    coalesce(body, ''),
    coalesce(collection_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(favorite, false)
  );
