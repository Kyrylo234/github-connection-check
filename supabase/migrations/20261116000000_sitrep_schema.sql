-- Run in an independent Supabase project. Existing tables are retained when migrating data.
create table if not exists public.publisher_news_cache (
  id text primary key default 'world' check (id = 'world'),
  snapshot jsonb,
  next_refresh_at timestamptz not null default now(),
  last_error text
);
alter table public.publisher_news_cache add column if not exists last_error text;
alter table public.publisher_news_cache enable row level security;
grant all on public.publisher_news_cache to service_role;

create or replace function public.claim_publisher_news_refresh()
returns boolean language plpgsql security definer set search_path = public as $$
declare claimed text;
begin
  insert into public.publisher_news_cache(id, next_refresh_at)
    values ('world', now() + interval '2 minutes')
    on conflict (id) do update set next_refresh_at = now() + interval '2 minutes'
    where publisher_news_cache.next_refresh_at <= now()
    returning id into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.claim_publisher_news_refresh() from public, anon, authenticated;
grant execute on function public.claim_publisher_news_refresh() to service_role;

create table if not exists public.news_analysis_cache (
  article_id text primary key,
  content_hash text not null,
  analysis jsonb not null,
  analyzed_at timestamptz not null default now()
);
alter table public.news_analysis_cache enable row level security;
grant all on public.news_analysis_cache to service_role;

create table if not exists public.news_analysis_budget (
  id text primary key check (id = 'world'),
  budget_day date not null default (now() at time zone 'UTC')::date,
  used integer not null default 0,
  next_at timestamptz not null default now(),
  paused_reason text,
  last_updated_at timestamptz
);
alter table public.news_analysis_budget enable row level security;
grant all on public.news_analysis_budget to service_role;

create or replace function public.claim_news_analysis_batch(batch_count integer)
returns text language plpgsql security definer set search_path = public as $$
declare state public.news_analysis_budget%rowtype;
begin
  if batch_count < 1 or batch_count > 15 then return 'Invalid batch'; end if;
  insert into public.news_analysis_budget(id) values ('world') on conflict do nothing;
  select * into state from public.news_analysis_budget where id = 'world' for update;
  if state.paused_reason is not null then return state.paused_reason; end if;
  if state.next_at > now() then return 'Another analysis is running or the one-minute cooldown is active.'; end if;
  if state.budget_day <> (now() at time zone 'UTC')::date then state.used := 0; end if;
  if state.used + batch_count > 60 then return 'Daily demo limit of 60 stories reached.'; end if;
  update public.news_analysis_budget set
    used = state.used + batch_count,
    budget_day = (now() at time zone 'UTC')::date,
    next_at = now() + interval '5 minutes'
    where id = 'world';
  return null;
end;
$$;
revoke all on function public.claim_news_analysis_batch(integer) from public, anon, authenticated;
grant execute on function public.claim_news_analysis_batch(integer) to service_role;

-- Keep live RSS stories and future curated historical collections in one indexed catalog.
create table if not exists public.news_archive (
  id text primary key,
  url text not null,
  title text not null,
  description text not null default '',
  source text not null,
  published_at timestamptz not null,
  category text not null,
  collection text not null default 'live',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists news_archive_published_at_idx on public.news_archive (published_at desc);
create index if not exists news_archive_collection_published_idx on public.news_archive (collection, published_at desc);
alter table public.news_archive enable row level security;
grant all on public.news_archive to service_role;
revoke all on public.news_archive from anon, authenticated;
