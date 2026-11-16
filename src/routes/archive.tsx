import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, ExternalLink } from "lucide-react";
import { z } from "zod";
import { getNewsArchivePage } from "@/lib/news-archive.functions";

export const Route = createFileRoute("/archive")({
  validateSearch: z.object({ page: z.coerce.number().int().min(1).max(10001).catch(1) }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ deps }) => getNewsArchivePage({ data: deps }),
  head: () => ({ meta: [{ title: "News archive — SitRep" }] }),
  component: ArchivePage,
});

function ArchivePage() {
  const { articles, count, page, pageSize } = Route.useLoaderData();
  const currentPage = page + 1;
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="font-system text-sm text-signal">← Back to globe</Link>
        <section className="briefing-document mt-6 overflow-hidden border border-report-rule bg-report-paper" aria-label="News archive">
          <div className="border-b border-report-rule px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <Archive className="size-5 text-signal" aria-hidden="true" />
              <h1 className="font-display text-3xl font-bold uppercase">News archive</h1>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Saved publisher headlines and summaries, newest first. Historical source collections can be added separately.</p>
            <p className="mt-4 font-system text-[11px] font-semibold uppercase text-signal">{count} saved stories</p>
          </div>
          <div className="divide-y divide-report-rule">
          {articles.map(article => (
            <article key={article.id} className="px-5 py-5 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-2 font-system text-[11px] font-semibold uppercase text-muted-foreground">
                <span className="font-mono">{article.source}</span>
                <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString("en-GB", { timeZone: "UTC" })}</time>
              </div>
              <h2 className="mt-3 font-mono text-base font-medium leading-7"><a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{article.title}<ExternalLink className="ml-2 inline size-3" aria-hidden="true" /></a></h2>
              {article.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{article.description}</p>}
            </article>
          ))}
          </div>
          <nav className="flex items-center justify-between gap-5 border-t border-report-rule px-5 py-4 font-system text-xs font-semibold uppercase sm:px-7" aria-label="Archive pages">
            {currentPage > 1 ? <a href={`/archive?page=${currentPage - 1}`} className="text-signal hover:underline">← Previous</a> : <span />}
            <span className="text-muted-foreground">Page {currentPage}</span>
            {currentPage * pageSize < count ? <a href={`/archive?page=${currentPage + 1}`} className="text-signal hover:underline">Next →</a> : <span />}
          </nav>
        </section>
      </div>
    </main>
  );
}
