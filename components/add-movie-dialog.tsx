"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addMovie, searchTitles } from "@/app/actions/movies";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { posterUrl } from "@/lib/format";
import type { MovieCardData } from "@/lib/types";

export function AddMovieDialog({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [local, setLocal] = useState<MovieCardData[]>([]);
  const [remote, setRemote] = useState<MovieCardData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [addingId, setAddingId] = useState<number | null>(null);

  if (!isLoggedIn) {
    return (
      <Button asChild>
        <Link href="/login">Adicionar filme</Link>
      </Button>
    );
  }

  function onSearch(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await searchTitles(query);
      setLocal(result.local);
      setRemote(result.remote);
      setError(result.error);
    });
  }

  function onAdd(tmdbId: number) {
    setAddingId(tmdbId);
    startTransition(async () => {
      const result = await addMovie(tmdbId);
      setAddingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.already
          ? "Esse filme já está no catálogo."
          : "Filme adicionado ao catálogo.",
      );
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar filme</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Adicionar filme</DialogTitle>
          <DialogDescription>
            A busca olha o catálogo e, se não achar, consulta o TMDB.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome do filme"
            aria-label="Nome do filme"
          />
          <Button type="submit" variant="secondary" disabled={pending}>
            Buscar
          </Button>
        </form>
        {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
          <ResultList
            title="No catálogo"
            movies={local}
            action="link"
            addingId={addingId}
            onAdd={onAdd}
          />
          <ResultList
            title="No TMDB"
            movies={remote}
            action="add"
            addingId={addingId}
            onAdd={onAdd}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultList({
  title,
  movies,
  action,
  addingId,
  onAdd,
}: {
  title: string;
  movies: MovieCardData[];
  action: "link" | "add";
  addingId: number | null;
  onAdd: (tmdbId: number) => void;
}) {
  if (movies.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-xs tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="space-y-2">
        {movies.map((movie) => {
          const src = posterUrl(movie.posterPath, "w185");
          return (
            <li
              key={movie.tmdbId}
              className="flex items-center gap-3 rounded-lg border border-border p-2"
            >
              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-secondary">
                {src ? (
                  <Image src={src} alt="" fill className="object-cover" sizes="44px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{movie.title}</p>
                <p className="text-xs text-muted-foreground">
                  {movie.year ?? "Ano desconhecido"}
                </p>
              </div>
              {action === "link" ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/filmes/${movie.tmdbId}`}>Ver</Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={addingId === movie.tmdbId}
                  onClick={() => onAdd(movie.tmdbId)}
                >
                  Adicionar
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
