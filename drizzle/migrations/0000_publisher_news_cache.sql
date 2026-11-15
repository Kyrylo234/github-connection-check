CREATE TABLE public.publisher_news_cache (id text PRIMARY KEY DEFAULT 'world' CHECK (id = 'world'), snapshot jsonb, next_refresh_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.publisher_news_cache TO service_role;
ALTER TABLE public.publisher_news_cache ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.claim_publisher_news_refresh() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE claimed text;
BEGIN
 INSERT INTO public.publisher_news_cache(id,next_refresh_at) VALUES ('world',now()+interval '10 minutes') ON CONFLICT (id) DO UPDATE SET next_refresh_at=now()+interval '10 minutes' WHERE publisher_news_cache.next_refresh_at <= now() RETURNING id INTO claimed;
 RETURN claimed IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_publisher_news_refresh() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_publisher_news_refresh() TO service_role;