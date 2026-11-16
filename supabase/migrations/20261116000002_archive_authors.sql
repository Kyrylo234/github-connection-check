-- Preserve creator credit for publisher feeds that permit attributed reuse.
alter table public.news_archive add column if not exists author text;
