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
        const previousValidator = snapshot?.validators?.[feed.name];
        const headers: Record<string, string> = { Accept: "application/rss+xml, application/xml, text/xml" };
        if (previousValidator?.etag) headers["If-None-Match"] = previousValidator.etag;
        if (previousValidator?.lastModified) headers["If-Modified-Since"] = previousValidator.lastModified;
        const response = await fetch(feed.url, { headers, signal: AbortSignal.timeout(12000) });
        if (response.status === 304 && snapshot) return {
          articles: snapshot.articles.filter(article => article.source === feed.name),
          error: null,
          validator: previousValidator,
        };
        if (!response.ok) return { articles: [], error: `${feed.name}: HTTP ${response.status}`, validator: undefined };
        const articles = parsePublisherFeed(await response.text(), feed.name);
        return {
          articles,
          error: articles.length ? null : `${feed.name}: no valid dated articles`,
          validator: {
            etag: response.headers?.get("etag") ?? undefined,
            lastModified: response.headers?.get("last-modified") ?? undefined,
          },
        };
      } catch { return { articles: [], error: `${feed.name}: feed unavailable or invalid`, validator: undefined }; }
    }));
    const articles = deduplicateNews(results.flatMap(result => result.articles));
    const errors = results.flatMap(result => result.error ? [result.error] : []);
    const validators = Object.fromEntries(results.map((result, index) => [PUBLISHER_FEEDS[index]!.name, result.validator]).filter((entry) => entry[1]));
    nextRefreshAt = new Date(Date.now() + NEWS_CACHE_MINUTES * 60_000).toISOString();
    if (!articles.length) {
      const failure = errors.join(" · ") || "No publisher headlines available";
      nextRefreshAt = new Date(Date.now() + 10 * 60_000).toISOString();
      await supabaseAdmin.from("publisher_news_cache").update({ last_error: failure, next_refresh_at: nextRefreshAt }).eq("id", "world");
      return { snapshot, nextRefreshAt, stale: true, error: failure };
    }
    snapshot = { articles, errors, fetchedAt: new Date().toISOString(), validators };
    const { error: saveError } = await supabaseAdmin.from("publisher_news_cache").update({ snapshot: JSON.parse(JSON.stringify(snapshot)), next_refresh_at: nextRefreshAt, last_error: null }).eq("id", "world");
    if (saveError) return { snapshot, nextRefreshAt, stale: true, error: "Headlines fetched, but the shared cache could not be saved." };
    return { snapshot, nextRefreshAt, stale: false, error: null };
  } catch {
    return { snapshot, nextRefreshAt, stale: true, error: "The shared news cache is unavailable. Demo fallback is shown if no saved headlines are available." };
  }
}
