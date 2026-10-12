import Image from "next/image";
import Link from "next/link";
import { formatScore, posterUrl } from "@/lib/format";
import type { MovieCardData } from "@/lib/types";

export function MovieCard({ movie }: { movie: MovieCardData }) {
  const src = posterUrl(movie.posterPath);

  return (
    <Link
      href={`/filmes/${movie.tmdbId}`}
      className="group relative block aspect-[2/3] overflow-hidden rounded-lg border border-border bg-card"
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="h-full bg-secondary" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-16">
        <p className="font-serif text-lg leading-tight text-white">{movie.title}</p>
        <p className="mt-1 text-xs text-white/75">
          {[movie.year, movie.inCatalog ? "No catálogo" : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {movie.inCatalog ? (
          <p className="mt-1 text-sm text-primary">
            {movie.average == null
              ? "Sem notas"
              : `${formatScore(movie.average)} · ${movie.ratingCount} ${movie.ratingCount === 1 ? "nota" : "notas"}`}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function MovieGrid({ movies }: { movies: MovieCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {movies.map((movie) => (
        <MovieCard key={movie.tmdbId} movie={movie} />
      ))}
    </div>
  );
}
