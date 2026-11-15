import { cleanNewsText, NEWS_CACHE_MINUTES, PUBLISHER_FEEDS, deduplicateNews, parsePublisherFeed, type NewsResponse, type NewsSnapshot } from "./publisher-news";

let developmentSnapshot: NewsSnapshot | null = null;
let developmentNextRefreshAt: string | null = null;
let developmentError: string | null = null;
let developmentRefresh: Promise<NewsResponse> | null = null;

async function refreshPublisherFeeds(previous: NewsSnapshot | null): Promise<{ snapshot: NewsSnapshot | null; error: string | null }> {
  const results = await Promise.all(PUBLISHER_FEEDS.map(async feed => {
    try {
      const previousValidator = previous?.validators?.[feed.name];
      const headers: Record<string, string> = { Accept: "application/rss+xml, application/xml, text/xml" };
      if (previousValidator?.etag) headers["If-None-Match"] = previousValidator.etag;
      if (previousValidator?.lastModified) headers["If-Modified-Since"] = previousValidator.lastModified;
      const response = await fetch(feed.url, { headers, signal: AbortSignal.timeout(12000) });
      if (response.status === 304 && previous) return {
        articles: previous.articles.filter(article => article.source === feed.name), error: null, validator: previousValidator,
      };
      if (!response.ok) return { articles: [], error: `${feed.name}: HTTP ${response.status}`, validator: undefined };
      const articles = parsePublisherFeed(await response.text(), feed.name);
      return { articles, error: articles.length ? null : `${feed.name}: no valid dated articles`, validator: {
        etag: response.headers?.get("etag") ?? undefined,
        lastModified: response.headers?.get("last-modified") ?? undefined,
      } };
    } catch { return { articles: [], error: `${feed.name}: feed unavailable or invalid`, validator: undefined }; }
  }));
  const articles = deduplicateNews(results.flatMap(result => result.articles));
  const errors = results.flatMap(result => result.error ? [result.error] : []);
  if (!articles.length) return { snapshot: previous, error: errors.join(" · ") || "No publisher headlines available" };
  const validators = Object.fromEntries(results.map((result, index) => [PUBLISHER_FEEDS[index]!.name, result.validator]).filter((entry) => entry[1]));
  return { snapshot: { articles, errors, fetchedAt: new Date().toISOString(), validators }, error: null };
}

async function fetchDevelopmentNews(): Promise<NewsResponse> {
  if (developmentNextRefreshAt && Date.now() < Date.parse(developmentNextRefreshAt)) return {
    snapshot: developmentSnapshot, nextRefreshAt: developmentNextRefreshAt, stale: !developmentSnapshot || Boolean(developmentError), error: developmentError,
  };
  developmentRefresh ??= (async () => {
    const refreshed = await refreshPublisherFeeds(developmentSnapshot);
    developmentSnapshot = refreshed.snapshot;
    developmentError = refreshed.error;
    developmentNextRefreshAt = new Date(Date.now() + NEWS_CACHE_MINUTES * 60_000).toISOString();
    return { snapshot: developmentSnapshot, nextRefreshAt: developmentNextRefreshAt, stale: Boolean(refreshed.error), error: refreshed.error };
  })().finally(() => { developmentRefresh = null; });
  return developmentRefresh;
}

export async function fetchPublisherNews(): Promise<NewsResponse> {
  // Local previews have no service-role secret. Keep one in-process fetch lease there;
  // deployed traffic still requires the durable database lease below.
  if (process.env['NODE_ENV'] === "development" && !process.env['SUPABASE_SERVICE_ROLE_KEY']) return fetchDevelopmentNews();
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

    const refreshed = await refreshPublisherFeeds(snapshot);
    nextRefreshAt = new Date(Date.now() + NEWS_CACHE_MINUTES * 60_000).toISOString();
    if (refreshed.error) {
      const failure = refreshed.error;
      nextRefreshAt = new Date(Date.now() + 10 * 60_000).toISOString();
      await supabaseAdmin.from("publisher_news_cache").update({ last_error: failure, next_refresh_at: nextRefreshAt }).eq("id", "world");
      return { snapshot, nextRefreshAt, stale: true, error: failure };
    }
    snapshot = refreshed.snapshot;
    const { error: saveError } = await supabaseAdmin.from("publisher_news_cache").update({ snapshot: JSON.parse(JSON.stringify(snapshot)), next_refresh_at: nextRefreshAt, last_error: null }).eq("id", "world");
    if (saveError) return { snapshot, nextRefreshAt, stale: true, error: "Headlines fetched, but the shared cache could not be saved." };
    return { snapshot, nextRefreshAt, stale: false, error: null };
  } catch {
    return { snapshot, nextRefreshAt, stale: true, error: "The shared news cache is unavailable. Live headlines could not load." };
  }
}
