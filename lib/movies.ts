import { averageScore, releaseYear } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { similarMovies } from "@/lib/tastedive";
import {
  fetchTmdbMovie,
  popularTmdbMovies,
  searchTmdbMovies,
  TmdbError,
  type TmdbMovie,
} from "@/lib/tmdb";
import type { MovieCardData, MovieView } from "@/lib/types";

const PAGE_SIZE = 24;

export type Listing =
  | {
      mode: "catalog";
      catalog: MovieCardData[];
      remote: MovieCardData[];
      page: number;
      hasNext: boolean;
      remoteError: string | null;
    }
  | {
      mode: "discover" | "search";
      catalog: MovieCardData[];
      remote: MovieCardData[];
      page: number;
      hasNext: boolean;
      remoteError: string | null;
    };

function tmdbMessage(error: unknown) {
  if (error instanceof TmdbError && error.code === "missing_key") {
    return "O TMDB não está configurado. Defina TMDB_ACCESS_TOKEN.";
  }
  if (error instanceof TmdbError) {
    return "Não foi possível consultar o TMDB agora.";
  }
  return "Não foi possível consultar o TMDB agora.";
}

function toCard(
  movie: {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    releaseDate: string | null;
    ratings: { score: number }[];
  },
  inCatalog: boolean,
): MovieCardData {
  return {
    tmdbId: movie.tmdbId,
    title: movie.title,
    posterPath: movie.posterPath,
    year: releaseYear(movie.releaseDate),
    average: averageScore(movie.ratings.map((rating) => rating.score)),
    ratingCount: movie.ratings.length,
    inCatalog,
  };
}

function remoteCard(movie: TmdbMovie): MovieCardData {
  return {
    tmdbId: movie.tmdbId,
    title: movie.title,
    posterPath: movie.posterPath,
    year: releaseYear(movie.releaseDate),
    average: null,
    ratingCount: 0,
    inCatalog: false,
  };
}

export async function listMovies(query: string, page: number): Promise<Listing> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const term = query.trim();

  if (term) {
    const local = await prisma.movie.findMany({
      where: { title: { contains: term, mode: "insensitive" } },
      include: { ratings: { select: { score: true } } },
      orderBy: { title: "asc" },
      take: PAGE_SIZE,
    });

    try {
      const remote = await searchTmdbMovies(term, safePage);
      const ids = remote.movies.map((movie) => movie.tmdbId);
      const known = await prisma.movie.findMany({
        where: { tmdbId: { in: ids } },
        select: { tmdbId: true },
      });
      const knownIds = new Set(known.map((movie) => movie.tmdbId));

      return {
        mode: "search",
        catalog: local.map((movie) => toCard(movie, true)),
        remote: remote.movies
          .filter((movie) => !knownIds.has(movie.tmdbId))
          .map(remoteCard),
        page: safePage,
        hasNext: safePage < remote.totalPages,
        remoteError: null,
      };
    } catch (error) {
      return {
        mode: "search",
        catalog: local.map((movie) => toCard(movie, true)),
        remote: [],
        page: safePage,
        hasNext: false,
        remoteError: tmdbMessage(error),
      };
    }
  }

  const total = await prisma.movie.count();
  if (total === 0) {
    try {
      const remote = await popularTmdbMovies(safePage);
      return {
        mode: "discover",
        catalog: [],
        remote: remote.movies.map(remoteCard),
        page: safePage,
        hasNext: safePage < remote.totalPages,
        remoteError: null,
      };
    } catch (error) {
      return {
        mode: "discover",
        catalog: [],
        remote: [],
        page: safePage,
        hasNext: false,
        remoteError: tmdbMessage(error),
      };
    }
  }

  const movies = await prisma.movie.findMany({
    include: { ratings: { select: { score: true } } },
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return {
    mode: "catalog",
    catalog: movies.map((movie) => toCard(movie, true)),
    remote: [],
    page: safePage,
    hasNext: safePage * PAGE_SIZE < total,
    remoteError: null,
  };
}

export async function getMovie(tmdbId: number): Promise<MovieView | null> {
  const cached = await prisma.movie.findUnique({
    where: { tmdbId },
    include: {
      ratings: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (cached) {
    return {
      tmdbId: cached.tmdbId,
      title: cached.title,
      overview: cached.overview,
      posterPath: cached.posterPath,
      releaseDate: cached.releaseDate,
      cached: true,
      ratings: cached.ratings.map((rating) => ({
        id: rating.id,
        score: rating.score,
        comment: rating.comment,
        author: rating.user.name,
        userId: rating.user.id,
        updatedAt: rating.updatedAt,
      })),
    };
  }

  try {
    const remote = await fetchTmdbMovie(tmdbId);
    return {
      tmdbId: remote.tmdbId,
      title: remote.title,
      overview: remote.overview,
      posterPath: remote.posterPath,
      releaseDate: remote.releaseDate,
      cached: false,
      ratings: [],
    };
  } catch (error) {
    if (error instanceof TmdbError && error.code === "not_found") return null;
    throw error;
  }
}

export async function saveMovie(tmdbId: number, addedById: string) {
  const existing = await prisma.movie.findUnique({ where: { tmdbId } });
  if (existing) return { movie: existing, already: true as const };

  const remote = await fetchTmdbMovie(tmdbId);
  const movie = await prisma.movie.create({
    data: {
      tmdbId: remote.tmdbId,
      title: remote.title,
      overview: remote.overview,
      posterPath: remote.posterPath,
      releaseDate: remote.releaseDate,
      addedById,
    },
  });

  return { movie, already: false as const };
}

export async function resolveRecommendation(name: string) {
  const local = await prisma.movie.findFirst({
    where: { title: { equals: name, mode: "insensitive" } },
  });

  if (local) {
    return {
      name: local.title,
      tmdbId: local.tmdbId,
      posterPath: local.posterPath,
      year: releaseYear(local.releaseDate),
    };
  }

  try {
    const remote = await searchTmdbMovies(name, 1);
    const match = remote.movies.find((movie) => {
      const target = name.toLowerCase();
      return (
        movie.title.toLowerCase() === target ||
        movie.originalTitle.toLowerCase() === target
      );
    });

    if (!match) {
      return { name, tmdbId: null, posterPath: null, year: null };
    }

    return {
      name: match.title,
      tmdbId: match.tmdbId,
      posterPath: match.posterPath,
      year: releaseYear(match.releaseDate),
    };
  } catch {
    return { name, tmdbId: null, posterPath: null, year: null };
  }
}

export async function recommendationsFor(title: string) {
  const result = await similarMovies(title);
  if (!result.ok) {
    return { items: [], message: result.message };
  }

  if (result.items.length === 0) {
    return {
      items: [],
      message: "O TasteDive não encontrou títulos parecidos.",
    };
  }

  const items = await Promise.all(
    result.items.map(async (item) => ({
      ...(await resolveRecommendation(item.name)),
      teaser: item.teaser,
    })),
  );

  return { items, message: null };
}
