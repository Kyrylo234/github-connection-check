import {
  cleanNewsText,
  NEWS_CACHE_MINUTES,
  PUBLISHER_FEEDS,
  deduplicateNews,
  parsePublisherFeed,
  type NewsResponse,
  type NewsSnapshot,
} from "./publisher-news";
import { mappableArticles, selectStoriesForAnalysis, storySignals } from "./news-classification";

let developmentSnapshot: NewsSnapshot | null = null;
let developmentNextRefreshAt: string | null = null;
let developmentError: string | null = null;
let developmentRefresh: Promise<NewsResponse> | null = null;

/** Analyse a bounded batch before any headline is written to the shared cache. */
async function usableSnapshot(
  raw: NewsSnapshot,
  previous: NewsSnapshot | null,
): Promise<NewsSnapshot> {
  const { analyzeNewsBatch, readNewsAnalysis } = await import("./news-classification.server");
  const existing = await readNewsAnalysis(raw.articles);
  const analyzedIds = new Set(existing.results.map((result) => result.articleId));
  const fresh = selectStoriesForAnalysis(raw.articles, analyzedIds, 3);
  if (fresh.length && process.env["GEMINI_API_KEY"]) {
    await analyzeNewsBatch(
      undefined,
      process.env["GEMINI_API_KEY"],
      fresh.map((article) => ({
        id: article.id,
        title: article.title,
        description: article.description ?? "",
      })),
      raw.articles,
    );
  }
  const { results } = await readNewsAnalysis(raw.articles);
  const articles = mappableArticles(raw.articles, results);
  const locatedIds = new Set(articles.map((article) => article.id));
  const unmappedSignals = storySignals(
    raw.articles.filter((article) => !locatedIds.has(article.id)),
    results,
  );
  return { ...raw, articles, unmappedSignals, archiveVersion: previous?.archiveVersion ?? 0 };
}

async function refreshPublisherFeeds(
  previous: NewsSnapshot | null,
): Promise<{ snapshot: NewsSnapshot | null; error: string | null }> {
  const results = await Promise.all(
    PUBLISHER_FEEDS.map(async (feed) => {
      try {
        const response = await fetch(feed.url, {
          headers: { Accept: "application/rss+xml, application/xml, text/xml" },
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) return { articles: [], error: `${feed.name}: HTTP ${response.status}` };
        const articles = parsePublisherFeed(await response.text(), feed.name)
          .filter((article) => !("articlePathPrefix" in feed) || Boolean(article.url && new URL(article.url).pathname.startsWith(feed.articlePathPrefix)));
        return {
          articles,
          error: articles.length ? null : `${feed.name}: no valid dated articles`,
        };
      } catch {
        return { articles: [], error: `${feed.name}: feed unavailable or invalid` };
      }
    }),
  );
  const articles = deduplicateNews(results.flatMap((result) => result.articles));
  const errors = results.flatMap((result) => (result.error ? [result.error] : []));
  if (!articles.length)
    return { snapshot: previous, error: errors.join(" · ") || "No publisher headlines available" };
  return { snapshot: { articles, errors, fetchedAt: new Date().toISOString() }, error: null };
}

async function fetchDevelopmentNews(): Promise<NewsResponse> {
  if (developmentNextRefreshAt && Date.now() < Date.parse(developmentNextRefreshAt))
    return {
      snapshot: developmentSnapshot,
      nextRefreshAt: developmentNextRefreshAt,
      stale: !developmentSnapshot || Boolean(developmentError),
      error: developmentError,
    };
  developmentRefresh ??= (async () => {
    const refreshed = await refreshPublisherFeeds(developmentSnapshot);
    if (!refreshed.error && refreshed.snapshot)
      developmentSnapshot = await usableSnapshot(refreshed.snapshot, developmentSnapshot);
    developmentError = refreshed.error;
    developmentNextRefreshAt = new Date(Date.now() + NEWS_CACHE_MINUTES * 60_000).toISOString();
    return {
      snapshot: developmentSnapshot,
      nextRefreshAt: developmentNextRefreshAt,
      stale: Boolean(refreshed.error),
      error: refreshed.error,
    };
  })().finally(() => {
    developmentRefresh = null;
  });
  return developmentRefresh;
}

export async function fetchPublisherNews(): Promise<NewsResponse> {
  // Local previews have no service-role secret. Keep one in-process fetch lease there;
  // deployed traffic still requires the durable database lease below.
  if (
    process.env["NODE_ENV"] === "development" &&
    !process.env["SUPABASE_SECRET_KEY"] &&
    !process.env["SUPABASE_SERVICE_ROLE_KEY"]
  )
    return fetchDevelopmentNews();
  // Privileged cache coordination, not user data: no caller parameters accepted.
  const { supabaseAdmin } = await import("./supabase-admin.server");
  let snapshot: NewsSnapshot | null = null;
  let nextRefreshAt: string | null = null;
  try {
    const { data, error } = await supabaseAdmin
      .from("publisher_news_cache")
      .select("snapshot,next_refresh_at,last_error")
      .eq("id", "world")
      .maybeSingle();
    if (error) throw new Error("News cache unavailable");
    snapshot = data?.snapshot ? (data.snapshot as unknown as NewsSnapshot) : null;
    if (snapshot) {
      const cleaned = snapshot.articles.map((article) => ({
        ...article,
        description: cleanNewsText(article.description),
      }));
      if (!snapshot.unmappedSignals) {
        const { readNewsAnalysis } = await import("./news-classification.server");
        const { results } = await readNewsAnalysis(cleaned);
        const articles = mappableArticles(cleaned, results);
        const locatedIds = new Set(articles.map((article) => article.id));
        snapshot = {
          ...snapshot,
          articles,
          unmappedSignals: storySignals(
            cleaned.filter((article) => !locatedIds.has(article.id)),
            results,
          ),
        };
      } else snapshot = { ...snapshot, articles: cleaned };
    }
    nextRefreshAt = data?.next_refresh_at ?? null;
    const { data: claimed, error: claimError } = await supabaseAdmin.rpc(
      "claim_publisher_news_refresh",
    );
    if (claimError) throw new Error("News refresh coordination unavailable");
    if (!claimed)
      return {
        snapshot,
        nextRefreshAt,
        stale: !snapshot || snapshot.errors.length > 0 || Boolean(data?.last_error),
        error:
          data?.last_error ?? (snapshot ? null : "News refresh in progress. Try again shortly."),
      };

    const refreshed = await refreshPublisherFeeds(snapshot);
    nextRefreshAt = new Date(Date.now() + NEWS_CACHE_MINUTES * 60_000).toISOString();
    if (refreshed.error) {
      const failure = refreshed.error;
      nextRefreshAt = new Date(Date.now() + 10 * 60_000).toISOString();
      await supabaseAdmin
        .from("publisher_news_cache")
        .update({ last_error: failure, next_refresh_at: nextRefreshAt })
        .eq("id", "world");
      return { snapshot, nextRefreshAt, stale: true, error: failure };
    }
    snapshot = refreshed.snapshot ? await usableSnapshot(refreshed.snapshot, snapshot) : null;
    if (snapshot && snapshot.archiveVersion !== 2) {
      try {
        const { reconcileLiveArchive } = await import("./news-archive.server");
        await reconcileLiveArchive();
        snapshot.archiveVersion = 2;
      } catch (error) {
        console.error("News archive cleanup failed", error);
      }
    }
    const { error: saveError } = await supabaseAdmin
      .from("publisher_news_cache")
      .update({
        snapshot: JSON.parse(JSON.stringify(snapshot)),
        next_refresh_at: nextRefreshAt,
        last_error: null,
      })
      .eq("id", "world");
    if (saveError)
      return {
        snapshot,
        nextRefreshAt,
        stale: true,
        error: "Headlines fetched, but the shared cache could not be saved.",
      };
    try {
      const { archivePublisherArticles } = await import("./news-archive.server");
      if (snapshot) await archivePublisherArticles(snapshot.articles);
    } catch (error) {
      console.error("News archive save failed", error);
    }
    return { snapshot, nextRefreshAt, stale: false, error: null };
  } catch {
    return {
      snapshot,
      nextRefreshAt,
      stale: true,
      error: "The shared news cache is unavailable. Live headlines could not load.",
    };
  }
}
