"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { listMovies, saveMovie } from "@/lib/movies";
import { prisma } from "@/lib/prisma";
import { TmdbError } from "@/lib/tmdb";
import type { MovieCardData } from "@/lib/types";

const scoreSchema = z.object({
  tmdbId: z.number().int().positive(),
  score: z.number().int().min(1).max(10),
  comment: z.string().trim().max(500, "O comentário pode ter até 500 caracteres."),
});

function tmdbErrorMessage(error: unknown) {
  if (error instanceof TmdbError && error.code === "missing_key") {
    return "O TMDB não está configurado. Defina TMDB_ACCESS_TOKEN.";
  }
  if (error instanceof TmdbError && error.code === "not_found") {
    return "Esse filme não existe no TMDB.";
  }
  return "Não foi possível consultar o TMDB agora.";
}

export async function searchTitles(query: string): Promise<{
  local: MovieCardData[];
  remote: MovieCardData[];
  error: string | null;
}> {
  const term = query.trim();
  if (term.length < 2) {
    return {
      local: [],
      remote: [],
      error: "Digite pelo menos 2 letras.",
    };
  }

  const listing = await listMovies(term, 1);
  return {
    local: listing.catalog,
    remote: listing.remote,
    error: listing.remoteError,
  };
}

export async function addMovie(tmdbId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Entre para adicionar um filme." };
  }

  const id = z.number().int().positive().safeParse(tmdbId);
  if (!id.success) {
    return { ok: false as const, error: "Filme inválido." };
  }

  try {
    const saved = await saveMovie(id.data, session.user.id);
    revalidatePath("/filmes");
    revalidatePath(`/filmes/${id.data}`);
    return { ok: true as const, already: saved.already, tmdbId: id.data };
  } catch (error) {
    return { ok: false as const, error: tmdbErrorMessage(error) };
  }
}

export async function rateMovie(tmdbId: number, score: number, comment: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Entre para avaliar." };
  }

  const parsed = scoreSchema.safeParse({ tmdbId, score, comment });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Nota inválida.",
    };
  }

  try {
    const saved = await saveMovie(parsed.data.tmdbId, session.user.id);
    await prisma.rating.upsert({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId: saved.movie.id,
        },
      },
      create: {
        score: parsed.data.score,
        comment: parsed.data.comment || null,
        userId: session.user.id,
        movieId: saved.movie.id,
      },
      update: {
        score: parsed.data.score,
        comment: parsed.data.comment || null,
      },
    });

    revalidatePath("/filmes");
    revalidatePath(`/filmes/${parsed.data.tmdbId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: tmdbErrorMessage(error) };
  }
}
