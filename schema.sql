-- Waitangi Wheel — database schema for Supabase
-- Run this once in: Supabase dashboard → SQL Editor → New query → paste → Run

-- ---------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------

create table public.clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  token      text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

create table public.checkins (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  week       text not null check (week in ('w1', 'w5', 'w10')),
  spokes     jsonb not null default '[null,null,null,null,null,null]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (client_id, week)
);

-- ---------------------------------------------------------------
-- Row Level Security
-- Clients (anon) get NO direct table access — only the two
-- functions below, which require a valid personal-link token.
-- Signed-in staff (authenticated) get full access.
-- ---------------------------------------------------------------

alter table public.clients  enable row level security;
alter table public.checkins enable row level security;

create policy "staff full access to clients"
  on public.clients for all to authenticated
  using (true) with check (true);

create policy "staff full access to checkins"
  on public.checkins for all to authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------
-- Client access functions (token = the personal link)
-- ---------------------------------------------------------------

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
           'weeks', coalesce(jsonb_object_agg(week, spokes), '{}'::jsonb)
         )
    into result
    from checkins
   where client_id = c.id;

  return result;
end;
$$;

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

  insert into checkins (client_id, week, spokes)
  values (cid, p_week, p_spokes)
  on conflict (client_id, week)
  do update set spokes = excluded.spokes, updated_at = now();
end;
$$;

grant execute on function public.wheel_get(text) to anon, authenticated;
grant execute on function public.wheel_save(text, text, jsonb) to anon, authenticated;
