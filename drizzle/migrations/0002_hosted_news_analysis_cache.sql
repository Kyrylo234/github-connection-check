CREATE TABLE public.news_analysis_cache (article_id text PRIMARY KEY, content_hash text NOT NULL, analysis jsonb NOT NULL, analyzed_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.news_analysis_cache TO service_role;
ALTER TABLE public.news_analysis_cache ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.news_analysis_budget (id text PRIMARY KEY CHECK (id='world'), budget_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date, used integer NOT NULL DEFAULT 0, next_at timestamptz NOT NULL DEFAULT now(), paused_reason text, last_updated_at timestamptz);
GRANT ALL ON public.news_analysis_budget TO service_role;
ALTER TABLE public.news_analysis_budget ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.claim_news_analysis_batch(batch_count integer) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE state public.news_analysis_budget%ROWTYPE;
BEGIN
 IF batch_count<1 OR batch_count>15 THEN RETURN 'Invalid batch'; END IF;
 INSERT INTO public.news_analysis_budget(id) VALUES('world') ON CONFLICT DO NOTHING;
 SELECT * INTO state FROM public.news_analysis_budget WHERE id='world' FOR UPDATE;
 IF state.paused_reason IS NOT NULL THEN RETURN state.paused_reason; END IF;
 IF state.next_at>now() THEN RETURN 'Another analysis is running or the one-minute cooldown is active.'; END IF;
 IF state.budget_day<>(now() AT TIME ZONE 'UTC')::date THEN state.used:=0; END IF;
 IF state.used+batch_count>60 THEN RETURN 'Daily demo limit of 60 stories reached.'; END IF;
 UPDATE public.news_analysis_budget SET used=state.used+batch_count,budget_day=(now() AT TIME ZONE 'UTC')::date,next_at=now()+interval '5 minutes' WHERE id='world';
 RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_news_analysis_batch(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_news_analysis_batch(integer) TO service_role;