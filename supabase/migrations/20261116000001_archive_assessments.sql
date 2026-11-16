-- Keep each archived live story usable without the short-lived analysis cache.
-- Nullable fields also allow future curated historical sources with incomplete data.
alter table public.news_archive
  add column if not exists sentiment double precision,
  add column if not exists severity double precision,
  add column if not exists location_name text,
  add column if not exists location_country text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists analysis_method text,
  add column if not exists analysis_confidence double precision,
  add column if not exists analysis_rationale text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'news_archive_sentiment_range') then
    alter table public.news_archive add constraint news_archive_sentiment_range check (sentiment between -1 and 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'news_archive_severity_range') then
    alter table public.news_archive add constraint news_archive_severity_range check (severity between 0 and 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'news_archive_latitude_range') then
    alter table public.news_archive add constraint news_archive_latitude_range check (latitude between -90 and 90);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'news_archive_longitude_range') then
    alter table public.news_archive add constraint news_archive_longitude_range check (longitude between -180 and 180);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'news_archive_confidence_range') then
    alter table public.news_archive add constraint news_archive_confidence_range check (analysis_confidence between 0 and 1);
  end if;
end $$;
