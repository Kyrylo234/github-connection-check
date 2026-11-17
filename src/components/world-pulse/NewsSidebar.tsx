import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { newsDate, type NewsResponse } from "@/lib/publisher-news";
import type { AnalyzedNewsEvent, NewsArticle } from "@/types/news";
import { SentimentBadge } from "./SentimentBadge";
import { NewsAttribution } from "./NewsAttribution";

export function NewsSidebar({ response, articles, events, refreshing, refresh, select }: {
  response: NewsResponse; articles: NewsArticle[]; events: AnalyzedNewsEvent[]; refreshing: boolean; refresh: () => void; select: (id: string) => void;
}) {
  const unavailable = !response.snapshot;
  return <aside aria-label="Latest available news" className="briefing-document hidden min-h-0 shrink-0 flex-col border border-report-rule bg-report-paper lg:flex lg:w-[300px]">
    <div className="shrink-0 border-b border-report-rule p-4">
      <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2.5"><Newspaper className="size-4 shrink-0 text-signal" aria-hidden="true" /><h2 className="font-display text-lg font-bold uppercase">Latest available news</h2></div>
        <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-sm text-muted-foreground" disabled={refreshing} onClick={refresh} aria-label="Refresh news" title="Refresh news"><RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} /></Button></div>
      {unavailable && <p className="mt-2 text-xs text-signal">LIVE NEWS UNAVAILABLE</p>}
      {(response.error || response.snapshot?.errors.length) ? <p role="alert" className="mt-2 text-xs leading-5 text-sentiment-negative">{response.error || response.snapshot?.errors.join(" · ")}</p> : null}
      {!unavailable && <div className="mt-3 border-t border-report-rule pt-3">
        <p className="mt-2 text-[11px] text-muted-foreground">{events.length} displayed map events</p>

        {response.analysis?.error && <p role="alert" className="mt-2 text-xs text-sentiment-negative">{response.analysis.error}</p>}
      </div>}
    </div>
    <div className="min-h-0 flex-1 divide-y divide-report-rule overflow-y-auto">
      {unavailable && <p role="status" className="p-4 text-xs leading-5 text-muted-foreground">Live headlines could not load. Refresh to try again; no fictional stories are shown as current news.</p>}
      {!unavailable && articles.length === 0 && <p role="status" className="p-4 text-xs leading-5 text-muted-foreground">No stories have a reliable map location yet. New headlines are checked during shared feed refreshes.</p>}
      {articles.map(article => {
        const located = events.find(event => event.articles.some(item => item.id === article.id));
        const classification = response.analysis?.results.find(result => result.articleId === article.id);
        return <article key={article.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 font-system text-[10px] font-semibold uppercase text-muted-foreground"><span className="font-mono">{article.source}</span><time dateTime={article.publishedAt}>{newsDate(article.publishedAt)}</time></div>
          <NewsAttribution article={article} />
          <h3 className="mt-3 font-mono text-[13px] font-medium leading-6">{article.url ? <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{article.title}<ExternalLink className="ml-1 inline size-3" /></a> : article.title}</h3>
          {article.description && <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{article.description}</p>}
          {(article.isDemo || classification) && <p className="mt-2 text-[10px] text-signal">{article.isDemo ? "Fictional demo" : "Gemini AI"}</p>}
          {classification && <div className="mt-1"><SentimentBadge score={classification.sentiment} showScore /></div>}

          {located && <Button variant="link" className="mt-1 h-auto p-0 text-xs" onClick={() => select(located.id)}>The Briefing · {located.location.country}</Button>}
        </article>;
      })}
    </div>
  </aside>;
}
