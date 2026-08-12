-- Waitangi Wheel — migration 2: submit & lock
-- Run once in Supabase SQL Editor (safe on the existing database).

alter table public.checkins
  add column if not exists submitted_at timestamptz;

-- wheel_get now also returns whether each week is locked (submitted).
create or replace function public.wheel_get(p_token text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  c record;
  result jsonb;
begin
  select id, name into c from clients where token = p_token;
  if not found then
    return null;
  end if;

  select jsonb_build_object(
           'name', c.name,
           'weeks', coalesce(
             jsonb_object_agg(
               week,
               jsonb_build_object('spokes', spokes, 'submitted', submitted_at is not null)
             ),
             '{}'::jsonb
           )
         )
    into result
    from checkins
   where client_id = c.id;

  return result;
end;
$$;

-- wheel_save refuses changes to a submitted (locked) week.
create or replace function public.wheel_save(p_token text, p_week text, p_spokes jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  cid uuid;
begin
  select id into cid from clients where token = p_token;
  if cid is null then
    raise exception 'invalid token';
  end if;
  if p_week not in ('w1', 'w5', 'w10') then
    raise exception 'invalid week';
  end if;
  if jsonb_typeof(p_spokes) <> 'array' or jsonb_array_length(p_spokes) <> 6 then
    raise exception 'invalid spokes';
  end if;
  if exists (
    select 1 from checkins
     where client_id = cid and week = p_week and submitted_at is not null
  ) then
    raise exception 'week locked';
  end if;

  insert into checkins (client_id, week, spokes)
  values (cid, p_week, p_spokes)
  on conflict (client_id, week)
  do update set spokes = excluded.spokes, updated_at = now();
end;
$$;

-- Lock in a completed week. Requires all six spokes to be marked.
create or replace function public.wheel_submit(p_token text, p_week text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  cid uuid;
  s jsonb;
begin
  select id into cid from clients where token = p_token;
  if cid is null then
    raise exception 'invalid token';
  end if;

  select spokes into s from checkins where client_id = cid and week = p_week;
  if not found then
    raise exception 'nothing to submit';
  end if;
  if exists (select 1 from jsonb_array_elements(s) e where e = 'null'::jsonb) then
    raise exception 'incomplete';
  end if;

  update checkins
     set submitted_at = coalesce(submitted_at, now())
   where client_id = cid and week = p_week;
end;
$$;

grant execute on function public.wheel_get(text) to anon, authenticated;
grant execute on function public.wheel_save(text, text, jsonb) to anon, authenticated;
grant execute on function public.wheel_submit(text, text) to anon, authenticated;
