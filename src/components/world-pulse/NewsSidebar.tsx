import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { locateNews, newsDate, type NewsResponse } from "@/lib/publisher-news";
import type { NewsArticle } from "@/types/news";

export function NewsSidebar({ response, articles, refreshing, refresh, select }: {
  response: NewsResponse; articles: NewsArticle[]; refreshing: boolean; refresh: () => void; select: (id: string) => void;
}) {
  const demo = !response.snapshot;
  return <aside aria-label="Latest available news" className="flex max-h-[660px] min-h-0 flex-col border-t border-border bg-background lg:max-h-none lg:w-[300px] lg:shrink-0 lg:border-l lg:border-t-0">
    <div className="border-b border-border p-4">
      <div className="flex items-center justify-between gap-2"><h2 className="font-display text-xl font-bold">Latest available news</h2>
        <Button variant="ghost" size="icon" disabled={refreshing} onClick={refresh} aria-label="Refresh news" title="Refresh news"><RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} /></Button></div>
      <p className="mt-2 text-xs text-signal">{demo ? "DEMO FALLBACK · Fictional articles" : response.stale ? "PUBLISHER RSS · Saved headlines" : "PUBLISHER RSS · Latest fetched headlines"}</p>
      {response.snapshot && <p className="mt-2 text-[11px] text-muted-foreground">Fetched {newsDate(response.snapshot.fetchedAt)}</p>}
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Shared 10-minute cache. Publication dates shown below; publisher updates may be delayed.</p>
      {response.nextRefreshAt && <p className="mt-1 text-[11px] text-muted-foreground">Next provider check after {newsDate(response.nextRefreshAt)}</p>}
      {(response.error || response.snapshot?.errors.length) ? <p role="alert" className="mt-2 text-xs leading-5 text-sentiment-negative">{response.error || response.snapshot?.errors.join(" · ")}</p> : null}
    </div>
    <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
      {articles.map(article => {
        const located = !article.isDemo && locateNews(article);
        return <article key={article.id} className="p-4">
          <p className="text-[11px] font-semibold text-signal">{article.source}</p>
          <h3 className="mt-2 text-xs font-semibold leading-6">{article.url ? <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{article.title}<ExternalLink className="ml-1 inline size-3" /></a> : article.title}</h3>
          <time dateTime={article.publishedAt} className="mt-2 block font-system text-[11px] text-muted-foreground">{newsDate(article.publishedAt)}</time>
          {article.description && <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{article.description}</p>}
          {located ? <Button variant="link" className="mt-1 h-auto p-0 text-xs" onClick={() => select(article.id)}>The Briefing · {located.location.country}</Button> : <p className="mt-2 text-[10px] text-muted-foreground">{article.isDemo ? "Fictional demo" : "Location unconfirmed · No map pin"}</p>}
        </article>;
      })}
    </div>
    <p className="border-t border-border p-3 text-[10px] leading-5 text-muted-foreground">Headlines via BBC News, The Guardian and Al Jazeera RSS. Rights remain with publishers. Location and scores use a keyword heuristic, not AI; national pins are approximate.</p>
  </aside>;
}