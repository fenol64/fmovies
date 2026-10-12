import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/format";

export type RecommendationItem = {
  name: string;
  tmdbId: number | null;
  posterPath: string | null;
  year: string | null;
  teaser: string | null;
};

export function Recommendations({
  items,
  message,
}: {
  items: RecommendationItem[];
  message: string | null;
}) {
  return (
    <section className="mt-16">
      <h2 className="font-serif text-3xl">Recomendações</h2>
      <p className="mt-2 text-sm text-muted-foreground">Sugestões do TasteDive.</p>
      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
      {items.length > 0 ? (
        <ul className="mt-6 flex gap-4 overflow-x-auto pb-2">
          {items.map((item) => {
            const src = posterUrl(item.posterPath, "w342");
            const body = (
              <>
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-card">
                  {src ? (
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-end p-3">
                      <span className="font-serif text-sm leading-tight">{item.name}</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm">{item.name}</p>
                {item.year ? (
                  <p className="text-xs text-muted-foreground">{item.year}</p>
                ) : null}
                {item.teaser ? (
                  <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{item.teaser}</p>
                ) : null}
              </>
            );

            return (
              <li key={`${item.name}-${item.tmdbId ?? "plain"}`} className="w-36 shrink-0">
                {item.tmdbId ? (
                  <Link href={`/filmes/${item.tmdbId}`} className="block">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
