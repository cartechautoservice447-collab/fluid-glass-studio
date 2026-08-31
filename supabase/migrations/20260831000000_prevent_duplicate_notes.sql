-- Replace the old content-based uniqueness rule.
-- Identical note content is allowed: users may intentionally create two notes
-- with the same title/body. Duplicate prevention must identify the same source
-- record being restored/replayed, not content that happens to match.
alter table public.notes add column if not exists source_id uuid;

drop index if exists public.notes_logical_unique_idx;
drop index if exists public.notes_logical_unique_current_user_idx;

-- A restored/imported note may carry its original note id as source_id.
-- The same source can therefore be restored at most once per user.
create unique index if not exists notes_source_unique_idx
  on public.notes (user_id, source_id)
  where source_id is not null;

-- Keep the database boundary locked down as well as the application layer.
alter table public.notes enable row level security;
alter table public.notes force row level security;
alter table public.courses enable row level security;
alter table public.courses force row level security;
alter table public.collections enable row level security;
alter table public.collections force row level security;

revoke all on public.notes, public.courses, public.collections from anon;
grant select, insert, update, delete on public.notes, public.courses, public.collections to authenticated;

-- Existing RLS policies already scope these tables to auth.uid() = user_id.
-- Keep those policies; FORCE RLS makes the restriction apply consistently.
