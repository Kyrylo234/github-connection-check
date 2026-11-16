import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { newsDate, type NewsResponse } from "@/lib/publisher-news";
import type { AnalyzedNewsEvent, NewsArticle } from "@/types/news";
import { SentimentBadge } from "./SentimentBadge";

export function NewsSidebar({ response, articles, events, refreshing, refresh, select }: {
  response: NewsResponse; articles: NewsArticle[]; events: AnalyzedNewsEvent[]; refreshing: boolean; refresh: () => void; select: (id: string) => void;
}) {
  const unavailable = !response.snapshot;
  return <aside aria-label="Latest available news" className="flex h-[660px] min-h-0 shrink-0 flex-col border-t border-border bg-background lg:h-auto lg:w-[300px] lg:border-l lg:border-t-0">
    <div className="shrink-0 border-b border-border p-4">
      <div className="flex items-center justify-between gap-2"><h2 className="font-display text-xl font-bold">Latest available news</h2>
        <Button variant="ghost" size="icon" disabled={refreshing} onClick={refresh} aria-label="Refresh news" title="Refresh news"><RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} /></Button></div>
      <p className="mt-2 text-xs text-signal">{unavailable ? "LIVE NEWS UNAVAILABLE" : response.stale ? "PUBLISHER RSS · Saved headlines" : "PUBLISHER RSS · Latest fetched headlines"}</p>
      {response.snapshot && <p className="mt-2 text-[11px] text-muted-foreground">Fetched {newsDate(response.snapshot.fetchedAt)}</p>}
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Shared two-minute feed refresh. This page checks for changes every 30 seconds while open.</p>
      {response.nextRefreshAt && <p className="mt-1 text-[11px] text-muted-foreground">Next provider check after {newsDate(response.nextRefreshAt)}</p>}
      {(response.error || response.snapshot?.errors.length) ? <p role="alert" className="mt-2 text-xs leading-5 text-sentiment-negative">{response.error || response.snapshot?.errors.join(" · ")}</p> : null}
      {!unavailable && <div className="mt-3 border-t border-border pt-3">
        <p role="status" className="text-xs text-signal">{response.analysis?.results.length ? "Gemini AI · Heuristic fallback for remaining stories" : "Heuristic fallback"}</p>
        <p className="mt-2 text-[11px] text-muted-foreground">{articles.length} stories with map locations · {response.analysis?.results.length ?? 0} analysed</p>
        <p className="mt-2 text-[10px] text-muted-foreground">New headlines are analysed automatically in small batches during shared feed refreshes. Only located stories are saved in the shared feed and live archive.</p>

        {response.analysis?.error && <p role="alert" className="mt-2 text-xs text-sentiment-negative">{response.analysis.error}</p>}
      </div>}
    </div>
    <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
      {unavailable && <p role="status" className="p-4 text-xs leading-5 text-muted-foreground">Live headlines could not load. Refresh to try again; no fictional stories are shown as current news.</p>}
      {!unavailable && articles.length === 0 && <p role="status" className="p-4 text-xs leading-5 text-muted-foreground">No stories have a reliable map location yet. New headlines are checked during shared feed refreshes.</p>}
      {articles.map(article => {
        const located = events.find(event => event.articles.some(item => item.id === article.id));
        const classification = response.analysis?.results.find(result => result.articleId === article.id);
        return <article key={article.id} className="p-4">
          <p className="text-[11px] font-semibold text-signal">{article.source}</p>
          <h3 className="mt-2 text-xs font-semibold leading-6">{article.url ? <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{article.title}<ExternalLink className="ml-1 inline size-3" /></a> : article.title}</h3>
          <time dateTime={article.publishedAt} className="mt-2 block font-system text-[11px] text-muted-foreground">{newsDate(article.publishedAt)}</time>
          {article.description && <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{article.description}</p>}
          <p className="mt-2 text-[10px] text-signal">{article.isDemo ? "Fictional demo" : classification ? "Gemini AI" : "Heuristic fallback"}</p>
          {classification && <div className="mt-1"><SentimentBadge score={classification.sentiment} showScore /></div>}

          {located && <Button variant="link" className="mt-1 h-auto p-0 text-xs" onClick={() => select(located.id)}>The Briefing · {located.location.country}</Button>}
        </article>;
      })}
    </div>
    <p className="shrink-0 border-t border-border p-3 text-[10px] leading-5 text-muted-foreground">Headlines via BBC News, The Guardian and Al Jazeera RSS. Rights remain with publishers. Gemini scores event impact and suggests place names; exact gazetteer matches supply coordinates. Uncertain places remain unpinned.</p>
  </aside>;
}
