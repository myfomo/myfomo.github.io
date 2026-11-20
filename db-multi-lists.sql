-- רשימות מרובות: לכל משתמש רשימות משלו + הצטרפות לרשימות של אחרים
create table if not exists public.lists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'הרשימה שלי',
  join_code   text not null unique default substr(md5(random()::text || clock_timestamp()::text), 1, 18),
  created_by  uuid,
  created_at  timestamptz not null default now()
);
create table if not exists public.list_members (
  list_id    uuid not null references public.lists(id) on delete cascade,
  user_id    uuid not null,
  email      text not null default '',
  role       text not null default 'member' check (role in ('owner','member')),
  last_seen  timestamptz,
  added_at   timestamptz not null default now(),
  primary key (list_id, user_id)
);
create table if not exists public.profiles (
  user_id  uuid primary key,
  name     text not null default ''
);
alter table public.restaurants add column if not exists list_id uuid references public.lists(id) on delete cascade;
create index if not exists restaurants_list_idx on public.restaurants(list_id);
create index if not exists list_members_user_idx on public.list_members(user_id);

create or replace function public.is_list_member(lid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.list_members where list_id = lid and user_id = auth.uid());
$$;
create or replace function public.is_list_owner(lid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.list_members where list_id = lid and user_id = auth.uid() and role = 'owner');
$$;
create or replace function public.shares_list(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select uid = auth.uid() or exists (select 1 from public.list_members a join public.list_members b on a.list_id = b.list_id
                where a.user_id = auth.uid() and b.user_id = uid);
$$;
create or replace function public.can_photo(objname text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.restaurants r join public.list_members m on m.list_id = r.list_id
                 where r.id::text = split_part(objname, '/', 1) and m.user_id = auth.uid());
$$;

-- העברת הרשימה הקיימת (אם כבר נרשמו משתמשים בגרסה הקודמת)
do $$ declare lid uuid; owner_email text; begin
  if not exists (select 1 from public.lists) and exists (select 1 from public.members where user_id is not null) then
    select email into owner_email from public.members order by added_at limit 1;
    insert into public.lists (name, join_code)
      values ('המסעדות שלנו', coalesce((select join_code from public.app_settings where id = 1), substr(md5(random()::text), 1, 18)))
      returning id into lid;
    insert into public.list_members (list_id, user_id, email, role, last_seen, added_at)
      select lid, m.user_id, m.email, case when m.email = owner_email then 'owner' else 'member' end, m.last_seen, m.added_at
      from public.members m where m.user_id is not null
      on conflict do nothing;
    insert into public.profiles (user_id, name)
      select user_id, name from public.members where user_id is not null on conflict do nothing;
    update public.lists set created_by = (select user_id from public.list_members where list_id = lid and role = 'owner' limit 1) where id = lid;
    update public.restaurants set list_id = lid where list_id is null;
  end if;
end $$;

-- פעולות
create or replace function public.create_list(list_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare lid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into public.lists (name, created_by) values (coalesce(nullif(trim(list_name), ''), 'הרשימה שלי'), auth.uid()) returning id into lid;
  insert into public.list_members (list_id, user_id, email, role, last_seen)
    values (lid, auth.uid(), lower(coalesce(auth.jwt()->>'email', '')), 'owner', now());
  -- הרשימה הראשונה במערכת מקבלת את המסעדות שהועברו מהגרסה הקודמת
  if (select count(*) from public.lists) = 1 then
    update public.restaurants set list_id = lid where list_id is null;
  end if;
  return lid;
end $$;

create or replace function public.join_list(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare lid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into lid from public.lists where join_code = trim(code);
  if lid is null then return null; end if;
  insert into public.list_members (list_id, user_id, email, role, last_seen)
    values (lid, auth.uid(), lower(coalesce(auth.jwt()->>'email', '')), 'member', now())
    on conflict (list_id, user_id) do update set last_seen = now();
  return lid;
end $$;

create or replace function public.touch_list(lid uuid) returns void
language sql security definer set search_path = public as $$
  update public.list_members set last_seen = now(), email = lower(coalesce(auth.jwt()->>'email', email))
  where list_id = lid and user_id = auth.uid();
$$;

create or replace function public.reset_list_code(lid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text := substr(md5(random()::text || clock_timestamp()::text), 1, 18);
begin
  if not public.is_list_owner(lid) then raise exception 'owner only'; end if;
  update public.lists set join_code = c where id = lid;
  return c;
end $$;

grant execute on function public.is_list_member(uuid), public.is_list_owner(uuid), public.shares_list(uuid), public.can_photo(text),
  public.create_list(text), public.join_list(text), public.touch_list(uuid), public.reset_list_code(uuid) to authenticated;
grant select, update, delete on public.lists to authenticated;
grant select, delete on public.list_members to authenticated;
grant select, insert, update on public.profiles to authenticated;

-- הרשאות
alter table public.lists enable row level security;
alter table public.list_members enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "lists read" on public.lists;
drop policy if exists "lists rename" on public.lists;
drop policy if exists "lists delete" on public.lists;
create policy "lists read"   on public.lists for select to authenticated using (public.is_list_member(id));
create policy "lists rename" on public.lists for update to authenticated using (public.is_list_owner(id)) with check (public.is_list_owner(id));
create policy "lists delete" on public.lists for delete to authenticated using (public.is_list_owner(id));

drop policy if exists "lm read" on public.list_members;
drop policy if exists "lm remove" on public.list_members;
create policy "lm read"   on public.list_members for select to authenticated using (public.is_list_member(list_id));
create policy "lm remove" on public.list_members for delete to authenticated
  using ((public.is_list_owner(list_id) and role <> 'owner') or (user_id = auth.uid() and role <> 'owner'));

drop policy if exists "profiles read" on public.profiles;
drop policy if exists "profiles add" on public.profiles;
drop policy if exists "profiles edit" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (public.shares_list(user_id));
create policy "profiles add"  on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "profiles edit" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "restaurants all" on public.restaurants;
drop policy if exists "restaurants by list" on public.restaurants;
create policy "restaurants by list" on public.restaurants for all to authenticated
  using (public.is_list_member(list_id)) with check (public.is_list_member(list_id));

drop policy if exists "photos read"   on storage.objects;
drop policy if exists "photos add"    on storage.objects;
drop policy if exists "photos remove" on storage.objects;
create policy "photos read"   on storage.objects for select to authenticated using (bucket_id = 'photos' and public.can_photo(name));
create policy "photos add"    on storage.objects for insert to authenticated with check (bucket_id = 'photos' and public.can_photo(name));
create policy "photos remove" on storage.objects for delete to authenticated using (bucket_id = 'photos' and public.can_photo(name));
