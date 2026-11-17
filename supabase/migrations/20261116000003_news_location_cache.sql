create table if not exists public.news_location_cache (
  cache_key text primary key,
  location_name text not null,
  location_country text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  confidence double precision not null check (confidence between 0 and 1),
  source text not null check (source = 'external'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.news_location_cache enable row level security;
grant all on public.news_location_cache to service_role;
revoke all on public.news_location_cache from anon, authenticated;
