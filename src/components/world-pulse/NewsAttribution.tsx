import type { NewsArticle } from "@/types/news";

/** Global Voices asks redistributors to credit the creator, original and license. */
export function NewsAttribution({ article }: { article: Pick<NewsArticle, "source" | "author" | "url"> }) {
  if (article.source !== "Global Voices") return null;
  return (
    <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
      {article.author ? `By ${article.author} · ` : ""}
      {article.url ? <a href={article.url} target="_blank" rel="noopener noreferrer" className="underline">Original at Global Voices</a> : "Global Voices"}
      {" · "}<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 3.0</a>
      {" · Feed summary formatted for display"}
    </p>
  );
}
