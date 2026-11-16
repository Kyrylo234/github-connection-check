import type { NewsArticle } from "@/types/news";
import { cleanNewsText } from "./publisher-news";
import { classifiedEvents } from "./news-classification";
import type { Classification } from "./news-classification";
import { readNewsAnalysis } from "./news-classification.server";

const PAGE_SIZE = 50;

export function archiveRows(articles: NewsArticle[], results: Classification[]) {
  return classifiedEvents(articles, results).map(event => {
    const article = event.articles[0]!;
    return {
      id: article.id,
      url: article.url ?? article.id,
      title: article.title,
      description: cleanNewsText(article.description),
      source: article.source,
      author: article.author ?? null,
      published_at: article.publishedAt,
      category: article.category ?? "Society",
      collection: "live",
      sentiment: event.sentiment,
      severity: event.severity,
      location_name: event.location.name,
      location_country: event.location.country,
      latitude: event.location.latitude,
      longitude: event.location.longitude,
      analysis_method: event.analysisMethod ?? "Heuristic fallback",
      analysis_confidence: event.confidence ?? null,
      analysis_rationale: event.rationale ?? null,
    };
  });
}

/** Called only by the publisher refresh lease holder. Every canonical URL has one row. */
export async function archivePublisherArticles(articles: NewsArticle[]): Promise<void> {
  if (!articles.length) return;
  const analysis = await readNewsAnalysis(articles);
  if (analysis.error?.startsWith("Hosted analysis cache unavailable")) throw new Error("Cannot verify archive locations while analysis cache is unavailable");
  const rows = archiveRows(articles, analysis.results);
  if (!rows.length) return;
  const { supabaseAdmin } = await import("./supabase-admin.server");
  for (let offset = 0; offset < rows.length; offset += PAGE_SIZE) {
    const batch = rows.slice(offset, offset + PAGE_SIZE);
    const { error } = await supabaseAdmin.from("news_archive").upsert(batch, { onConflict: "id" });
    if (error?.code === "PGRST204" || error?.code === "42703") {
      // Keep headlines until the additive assessment migration is applied;
      // the one-time reconciliation will fill the missing values afterward.
      const legacyRows = batch.map(row => ({
        id: row.id, url: row.url, title: row.title, description: row.description, source: row.source,
        published_at: row.published_at, category: row.category, collection: row.collection,
      }));
      const { error: fallbackError } = await supabaseAdmin.from("news_archive").upsert(legacyRows, { onConflict: "id" });
      if (fallbackError) throw new Error("News archive could not be saved");
    } else if (error) throw new Error("News archive could not be saved");
  }
}

/** One-time cleanup and assessment backfill for previously archived live rows. */
export async function reconcileLiveArchive(): Promise<void> {
  const { supabaseAdmin } = await import("./supabase-admin.server");
  const { error: schemaError } = await supabaseAdmin.from("news_archive").select("sentiment").limit(0);
  if (schemaError) throw new Error("Apply the archive assessment migration before backfilling live stories");
  let afterId: string | null = null;
  while (true) {
    let query = supabaseAdmin.from("news_archive")
      .select("id,url,title,description,source,author,published_at,category")
      .eq("collection", "live").order("id", { ascending: true }).limit(PAGE_SIZE);
    if (afterId) query = query.gt("id", afterId);
    const { data, error } = await query;
    if (error) throw new Error("Could not inspect the live news archive");
    if (!data?.length) return;
    const articles = data.map(row => ({
      id: row.id, url: row.url, title: row.title, description: cleanNewsText(row.description),
      source: row.source, ...(row.author ? { author: row.author } : {}), publishedAt: row.published_at, category: row.category as NonNullable<NewsArticle["category"]>, isDemo: false,
    }));
    const analysis = await readNewsAnalysis(articles);
    if (analysis.error?.startsWith("Hosted analysis cache unavailable")) throw new Error("Cannot verify archived locations while analysis cache is unavailable");
    const rows = archiveRows(articles, analysis.results);
    const located = new Set(rows.map(row => row.id));
    const unusableIds = articles.filter(article => !located.has(article.id)).map(article => article.id);
    if (unusableIds.length) {
      const { error: deleteError } = await supabaseAdmin.from("news_archive").delete().eq("collection", "live").in("id", unusableIds);
      if (deleteError) throw new Error("Could not remove unlocatable archive stories");
    }
    if (rows.length) {
      const { error: saveError } = await supabaseAdmin.from("news_archive").upsert(rows, { onConflict: "id" });
      if (saveError) throw new Error("Could not backfill archived story assessments; apply the archive assessment migration");
    }
    afterId = data[data.length - 1]!.id;
  }
}

/** Public server read with a fixed page size; service credentials never reach the browser. */
export async function readNewsArchive(page: number) {
  if (!Number.isSafeInteger(page) || page < 0 || page > 10000) throw new Error("Invalid archive page");
  const { supabaseAdmin } = await import("./supabase-admin.server");
  const { data, error, count } = await supabaseAdmin.from("news_archive")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (error) throw new Error("News archive unavailable");
  return {
    articles: (data ?? []).map(row => ({
      id: row.id, url: row.url, title: row.title, description: row.description,
      source: row.source, ...(row.author ? { author: row.author } : {}), publishedAt: row.published_at, category: row.category,
      sentiment: row.sentiment ?? null, severity: row.severity ?? null,
      location: row.location_name && row.location_country && row.latitude != null && row.longitude != null
        ? { name: row.location_name, country: row.location_country, latitude: row.latitude, longitude: row.longitude } : null,
      analysisMethod: row.analysis_method ?? null, analysisConfidence: row.analysis_confidence ?? null,
      analysisRationale: row.analysis_rationale ?? null,
      isDemo: false,
    })),
    count: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}
