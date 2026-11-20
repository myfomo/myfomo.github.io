-- תגובות, הצבעות ופיד פעילות
create table if not exists public.comments (
  id             uuid primary key default gen_random_uuid(),
  list_id        uuid not null references public.lists(id) on delete cascade,
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  user_id        uuid not null default auth.uid(),
  body           text not null check (char_length(body) between 1 and 500),
  created_at     timestamptz not null default now()
);
create index if not exists comments_rest_idx on public.comments(restaurant_id);

create table if not exists public.polls (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.lists(id) on delete cascade,
  created_by  uuid not null default auth.uid(),
  title       text not null default '',
  options     jsonb not null default '[]'::jsonb,
  votes       jsonb not null default '{}'::jsonb,
  closed      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists polls_list_idx on public.polls(list_id, created_at desc);

create table if not exists public.activity (
  id             uuid primary key default gen_random_uuid(),
  list_id        uuid not null references public.lists(id) on delete cascade,
  user_id        uuid not null default auth.uid(),
  kind           text not null,
  restaurant_id  uuid,
  text           text not null default '',
  created_at     timestamptz not null default now()
);
create index if not exists activity_list_idx on public.activity(list_id, created_at desc);

create or replace function public.vote_poll(pid uuid, choice text) returns void
language plpgsql security definer set search_path = public as $$
declare lid uuid;
begin
  select list_id into lid from public.polls where id = pid and not closed;
  if lid is null or not public.is_list_member(lid) then raise exception 'not allowed'; end if;
  update public.polls set votes = votes || jsonb_build_object(auth.uid()::text, choice) where id = pid;
end $$;
grant execute on function public.vote_poll(uuid, text) to authenticated;

grant select, insert, delete on public.comments to authenticated;
grant select, insert, update, delete on public.polls to authenticated;
grant select, insert on public.activity to authenticated;

alter table public.comments enable row level security;
alter table public.polls enable row level security;
alter table public.activity enable row level security;

drop policy if exists "comments read" on public.comments;
drop policy if exists "comments add" on public.comments;
drop policy if exists "comments remove" on public.comments;
create policy "comments read"   on public.comments for select to authenticated using (public.is_list_member(list_id));
create policy "comments add"    on public.comments for insert to authenticated with check (public.is_list_member(list_id) and user_id = auth.uid());
create policy "comments remove" on public.comments for delete to authenticated using (user_id = auth.uid() or public.is_list_owner(list_id));

drop policy if exists "polls read" on public.polls;
drop policy if exists "polls add" on public.polls;
drop policy if exists "polls edit" on public.polls;
drop policy if exists "polls remove" on public.polls;
create policy "polls read"   on public.polls for select to authenticated using (public.is_list_member(list_id));
create policy "polls add"    on public.polls for insert to authenticated with check (public.is_list_member(list_id) and created_by = auth.uid());
create policy "polls edit"   on public.polls for update to authenticated using (created_by = auth.uid() or public.is_list_owner(list_id)) with check (public.is_list_member(list_id));
create policy "polls remove" on public.polls for delete to authenticated using (created_by = auth.uid() or public.is_list_owner(list_id));

drop policy if exists "activity read" on public.activity;
drop policy if exists "activity add" on public.activity;
create policy "activity read" on public.activity for select to authenticated using (public.is_list_member(list_id));
create policy "activity add"  on public.activity for insert to authenticated with check (public.is_list_member(list_id) and user_id = auth.uid());

do $$ begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.polls; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.activity; exception when duplicate_object then null; end $$;
