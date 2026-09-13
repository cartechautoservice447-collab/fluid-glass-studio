begin;

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  system_enabled boolean not null default true,
  sound_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  source_id text,
  event_type text not null,
  title text not null,
  body text not null default '',
  scheduled_for timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  dedupe_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists notification_events_user_dedupe_key
  on public.notification_events(user_id, dedupe_key);

create index if not exists notification_events_user_scheduled_idx
  on public.notification_events(user_id, scheduled_for desc);

create index if not exists notification_events_user_unread_idx
  on public.notification_events(user_id, read_at, created_at desc);

create table if not exists public.planner_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  kind text not null default 'reminder',
  starts_at timestamptz,
  due_at timestamptz,
  timezone text not null default 'UTC',
  recurrence jsonb not null default '{}'::jsonb,
  reminder_minutes integer,
  notification_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_items_kind_check check (kind in ('reminder','study','exam','project','course_deadline','assignment')),
  constraint planner_items_reminder_check check (reminder_minutes is null or reminder_minutes >= 0)
);

create index if not exists planner_items_user_starts_idx
  on public.planner_items(user_id, starts_at);

create index if not exists planner_items_user_due_idx
  on public.planner_items(user_id, due_at);

create table if not exists public.daily_dedication (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, local_date)
);

create index if not exists daily_dedication_user_date_idx
  on public.daily_dedication(user_id, local_date desc);

alter table public.notification_preferences enable row level security;
alter table public.notification_events enable row level security;
alter table public.planner_items enable row level security;
alter table public.daily_dedication enable row level security;

create policy "Users manage their own notification preferences"
  on public.notification_preferences
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users read their own notification events"
  on public.notification_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users update their own notification events"
  on public.notification_events
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Authenticated users create their own notification events"
  on public.notification_events
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own notification events"
  on public.notification_events
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users manage their own planner items"
  on public.planner_items
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own daily dedication"
  on public.daily_dedication
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.touch_notification_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notification_preferences_updated_at on public.notification_preferences;
create trigger notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.touch_notification_preferences_updated_at();

create or replace function public.touch_planner_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists planner_items_updated_at on public.planner_items;
create trigger planner_items_updated_at
before update on public.planner_items
for each row execute function public.touch_planner_items_updated_at();

commit;
