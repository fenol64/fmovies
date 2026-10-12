import Link from "next/link";
import { auth } from "@/auth";
import { AddMovieDialog } from "@/components/add-movie-dialog";
import { MovieGrid } from "@/components/movie-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listMovies } from "@/lib/movies";

function pageHref(page: number, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `/filmes?${value}` : "/filmes";
}

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const session = await auth();
  const listing = await listMovies(query, page);
  const movies = listing.mode === "catalog" ? listing.catalog : [...listing.catalog, ...listing.remote];
  const showSections = listing.mode === "search";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl">Filmes</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            O catálogo guarda o que já foi adicionado ou avaliado. A busca completa com o TMDB.
          </p>
        </div>
        <AddMovieDialog isLoggedIn={Boolean(session?.user)} />
      </div>

      <form action="/filmes" className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Buscar filme"
          aria-label="Buscar filme"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        {query ? (
          <Button variant="ghost" asChild>
            <Link href="/filmes">Limpar</Link>
          </Button>
        ) : null}
      </form>

      {listing.remoteError ? (
        <p className="mt-6 text-sm text-muted-foreground">{listing.remoteError}</p>
      ) : null}

      {listing.mode === "discover" ? (
        <div className="mt-10">
          <h2 className="font-serif text-2xl">Descoberta</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O catálogo ainda está vazio. Estes títulos populares vêm do TMDB.
          </p>
        </div>
      ) : null}

      {showSections ? (
        <div className="mt-10 space-y-10">
          <section>
            <h2 className="mb-4 font-serif text-2xl">No catálogo</h2>
            {listing.catalog.length > 0 ? (
              <MovieGrid movies={listing.catalog} />
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum título salvo com esse nome.</p>
            )}
          </section>
          <section>
            <h2 className="mb-4 font-serif text-2xl">No TMDB</h2>
            {listing.remote.length > 0 ? (
              <MovieGrid movies={listing.remote} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum título novo fora do catálogo.
              </p>
            )}
          </section>
        </div>
      ) : (
        <div className="mt-8">
          {movies.length > 0 ? (
            <MovieGrid movies={movies} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum filme para mostrar. Adicione um título ou confira a chave do TMDB.
            </p>
          )}
        </div>
      )}

      {page > 1 || listing.hasNext ? (
        <div className="mt-10 flex items-center justify-between">
          {page > 1 ? (
            <Button variant="outline" asChild>
              <Link href={pageHref(page - 1, query)}>Anterior</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">Página {page}</span>
          {listing.hasNext ? (
            <Button variant="outline" asChild>
              <Link href={pageHref(page + 1, query)}>Próxima</Link>
            </Button>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}
