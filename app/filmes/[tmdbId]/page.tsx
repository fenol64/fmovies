import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { RatingForm } from "@/components/rating-form";
import { Recommendations } from "@/components/recommendations";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { averageScore, formatDate, formatScore, initials, posterUrl, releaseYear } from "@/lib/format";
import { getMovie, recommendationsFor } from "@/lib/movies";
import { TmdbError } from "@/lib/tmdb";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ tmdbId: string }>;
}) {
  const { tmdbId } = await params;
  const id = Number(tmdbId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let movie;
  try {
    movie = await getMovie(id);
  } catch (error) {
    if (error instanceof TmdbError) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="font-serif text-4xl">TMDB indisponível</h1>
          <p className="mt-3 text-muted-foreground">
            {error.code === "missing_key"
              ? "Defina TMDB_ACCESS_TOKEN para abrir um filme que ainda não está no catálogo."
              : "Não foi possível consultar o TMDB agora."}
          </p>
        </div>
      );
    }
    throw error;
  }

  if (!movie) notFound();

  const session = await auth();
  const mine = movie.ratings.find((rating) => rating.userId === session?.user?.id);
  const average = averageScore(movie.ratings.map((rating) => rating.score));
  const poster = posterUrl(movie.posterPath);
  const recommendations = await recommendationsFor(movie.title);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-[minmax(0,280px)_1fr]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border bg-card">
          {poster ? (
            <Image
              src={poster}
              alt=""
              fill
              priority
              sizes="280px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-end p-4">
              <span className="font-serif text-3xl">{movie.title}</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-muted-foreground">{releaseYear(movie.releaseDate) ?? "Ano desconhecido"}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-6xl">{movie.title}</h1>
          <p className="mt-6 font-serif text-6xl text-primary">
            {average == null ? "—" : formatScore(average)}
          </p>
          <p className="text-sm text-muted-foreground">
            {movie.ratings.length === 0
              ? "Ainda sem notas"
              : `${movie.ratings.length} ${movie.ratings.length === 1 ? "nota" : "notas"}`}
          </p>
          <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
            {movie.overview || "Sem sinopse."}
          </p>

          <div className="mt-8">
            <RatingForm
              tmdbId={movie.tmdbId}
              isLoggedIn={Boolean(session?.user)}
              currentScore={mine?.score}
              currentComment={mine?.comment ?? ""}
            />
          </div>

          <section className="mt-10">
            <h2 className="font-serif text-3xl">Notas</h2>
            {movie.ratings.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Ninguém avaliou este filme ainda.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {movie.ratings.map((rating) => (
                  <li key={rating.id} className="flex gap-3 rounded-xl border border-border p-4">
                    <Avatar>
                      <AvatarFallback>{initials(rating.author) || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{rating.author}</p>
                        {rating.userId === session?.user?.id ? <Badge>Sua nota</Badge> : null}
                        <span className="font-serif text-lg text-primary">{rating.score}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(rating.updatedAt)}
                        </span>
                      </div>
                      {rating.comment ? (
                        <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {rating.comment}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <Recommendations items={recommendations.items} message={recommendations.message} />
    </div>
  );
}
