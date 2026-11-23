-- v53: preview of a group on the sign-up screen of an invite link
-- (who invited, the group name, and up to 3 places; surprise outings are left out).
-- Read-only. Works only with a valid join code.
create or replace function public.invite_preview(code text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'name', l.name,
    'by', (select nullif(p.name,'') from profiles p where p.user_id = l.created_by),
    'n', (select count(*) from restaurants r where r.list_id = l.id and coalesce(r.data->>'_meta','') <> 'true'),
    'places', (select coalesce(json_agg(x.nm), '[]'::json) from (
        select r.data->>'name' as nm from restaurants r
        where r.list_id = l.id and coalesce(r.data->>'_meta','') <> 'true'
          and coalesce(r.data->'visits','[]'::jsonb)::text not like '%"surprise"%'
        order by r.updated_at desc limit 3) x))
  from lists l where length(coalesce(code,'')) >= 8 and l.join_code = code limit 1
$$;
revoke all on function public.invite_preview(text) from public;
grant execute on function public.invite_preview(text) to anon, authenticated;
