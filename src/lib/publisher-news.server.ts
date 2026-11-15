import { cleanNewsText, NEWS_CACHE_MINUTES, PUBLISHER_FEEDS, deduplicateNews, parsePublisherFeed, type NewsResponse, type NewsSnapshot } from "./publisher-news";

export async function fetchPublisherNews(): Promise<NewsResponse> {
  // Privileged cache coordination, not user data: no caller parameters accepted.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let snapshot: NewsSnapshot | null = null;
  let nextRefreshAt: string | null = null;
  try {
    const { data, error } = await supabaseAdmin.from("publisher_news_cache").select("snapshot,next_refresh_at,last_error").eq("id", "world").maybeSingle();
    if (error) throw new Error("News cache unavailable");
    snapshot = data?.snapshot ? data.snapshot as unknown as NewsSnapshot : null;
    if (snapshot) snapshot = { ...snapshot, articles: snapshot.articles.map(article => ({ ...article, description: cleanNewsText(article.description) })) };
    nextRefreshAt = data?.next_refresh_at ?? null;
    const { data: claimed, error: claimError } = await supabaseAdmin.rpc("claim_publisher_news_refresh");
    if (claimError) throw new Error("News refresh coordination unavailable");
    if (!claimed) return { snapshot, nextRefreshAt, stale: !snapshot || snapshot.errors.length > 0 || Boolean(data?.last_error), error: data?.last_error ?? (snapshot ? null : "News refresh in progress. Try again shortly.") };

    const results = await Promise.all(PUBLISHER_FEEDS.map(async feed => {
      try {
        const response = await fetch(feed.url, { headers: { Accept: "application/rss+xml, application/xml, text/xml" }, signal: AbortSignal.timeout(12000) });
        if (!response.ok) return { articles: [], error: `${feed.name}: HTTP ${response.status}` };
        const articles = parsePublisherFeed(await response.text(), feed.name);
        return { articles, error: articles.length ? null : `${feed.name}: no valid dated articles` };
      } catch { return { articles: [], error: `${feed.name}: feed unavailable or invalid` }; }
    }));
    const articles = deduplicateNews(results.flatMap(result => result.articles));
    const errors = results.flatMap(result => result.error ? [result.error] : []);
    nextRefreshAt = new Date(Date.now() + NEWS_CACHE_MINUTES * 60_000).toISOString();
    if (!articles.length) {
      const failure = errors.join(" · ") || "No publisher headlines available";
      await supabaseAdmin.from("publisher_news_cache").update({ last_error: failure }).eq("id", "world");
      return { snapshot, nextRefreshAt, stale: true, error: failure };
    }
    snapshot = { articles, errors, fetchedAt: new Date().toISOString() };
    const { error: saveError } = await supabaseAdmin.from("publisher_news_cache").update({ snapshot: JSON.parse(JSON.stringify(snapshot)), next_refresh_at: nextRefreshAt, last_error: null }).eq("id", "world");
    if (saveError) return { snapshot, nextRefreshAt, stale: true, error: "Headlines fetched, but the shared cache could not be saved." };
    return { snapshot, nextRefreshAt, stale: false, error: null };
  } catch {
    return { snapshot, nextRefreshAt, stale: true, error: "The shared news cache is unavailable. Demo fallback is shown if no saved headlines are available." };
  }
}