import { createFileRoute, Link } from "@tanstack/react-router";
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
        <h1 className="mt-6 font-display text-4xl">News archive</h1>
        <p className="mt-2 text-sm text-muted-foreground">Saved publisher headlines and summaries, newest first. Historical source collections can be added separately.</p>
        <p className="mt-5 font-system text-xs text-muted-foreground">{count} saved stories</p>
        <div className="mt-5 space-y-3">
          {articles.map(article => (
            <article key={article.id} className="rounded border border-border p-4">
              <p className="font-system text-xs text-muted-foreground">{article.source} · {new Date(article.publishedAt).toLocaleDateString("en-GB", { timeZone: "UTC" })}</p>
              <h2 className="mt-2 text-lg font-semibold"><a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-signal">{article.title}</a></h2>
              {article.description && <p className="mt-2 text-sm text-muted-foreground">{article.description}</p>}
            </article>
          ))}
        </div>
        <nav className="mt-8 flex gap-5 font-system text-sm" aria-label="Archive pages">
          {currentPage > 1 && <a href={`/archive?page=${currentPage - 1}`} className="text-signal">Previous</a>}
          {currentPage * pageSize < count && <a href={`/archive?page=${currentPage + 1}`} className="text-signal">Next</a>}
        </nav>
      </div>
    </main>
  );
}
