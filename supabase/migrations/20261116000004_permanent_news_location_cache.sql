alter table public.news_location_cache
  alter column expires_at drop not null;

update public.news_location_cache
set expires_at = null
where expires_at is not null;
