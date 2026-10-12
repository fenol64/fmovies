const TMDB_BASE = "https://api.themoviedb.org/3";

export class TmdbError extends Error {
  constructor(
    message: string,
    readonly code: "missing_key" | "http" | "not_found",
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

type TmdbMovieDto = {
  id: number;
  title: string;
  original_title?: string;
  overview: string | null;
  poster_path: string | null;
  release_date?: string | null;
};

type TmdbList = {
  results: TmdbMovieDto[];
  total_pages: number;
};

export type TmdbMovie = {
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string | null;
};

function mapMovie(movie: TmdbMovieDto): TmdbMovie {
  return {
    tmdbId: movie.id,
    title: movie.title,
    originalTitle: movie.original_title || movie.title,
    overview: movie.overview ?? "",
    posterPath: movie.poster_path,
    releaseDate: movie.release_date || null,
  };
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}) {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    throw new TmdbError(
      "TMDB_ACCESS_TOKEN ausente",
      "missing_key",
    );
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("language", "pt-BR");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new TmdbError("Filme não encontrado no TMDB", "not_found");
  }

  if (!response.ok) {
    throw new TmdbError(`TMDB respondeu ${response.status}`, "http");
  }

  return (await response.json()) as T;
}

export async function searchTmdbMovies(query: string, page = 1) {
  const data = await tmdbFetch<TmdbList>("/search/movie", {
    query,
    page: String(page),
    include_adult: "false",
  });

  return {
    movies: data.results.map(mapMovie),
    totalPages: data.total_pages,
  };
}

export async function popularTmdbMovies(page = 1) {
  const data = await tmdbFetch<TmdbList>("/movie/popular", {
    page: String(page),
  });

  return {
    movies: data.results.map(mapMovie),
    totalPages: data.total_pages,
  };
}

export async function fetchTmdbMovie(tmdbId: number) {
  const movie = await tmdbFetch<TmdbMovieDto>(`/movie/${tmdbId}`);
  return mapMovie(movie);
}
