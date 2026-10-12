"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { rateMovie } from "@/app/actions/movies";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function RatingForm({
  tmdbId,
  isLoggedIn,
  currentScore,
  currentComment,
}: {
  tmdbId: number;
  isLoggedIn: boolean;
  currentScore?: number;
  currentComment?: string;
}) {
  const router = useRouter();
  const [score, setScore] = useState(currentScore ?? 0);
  const [comment, setComment] = useState(currentComment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Entre para deixar a sua nota.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    );
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (score < 1) {
      setError("Escolha uma nota de 1 a 10.");
      return;
    }

    startTransition(async () => {
      const result = await rateMovie(tmdbId, score, comment);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Nota salva.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <p className="text-sm font-medium">Sua nota</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {scores.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScore(value)}
              className={cn(
                "h-10 w-10 cursor-pointer rounded-md border text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                score === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent",
              )}
              aria-pressed={score === value}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={500}
        placeholder="Comentário opcional"
        aria-label="Comentário"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {currentScore ? "Atualizar nota" : "Publicar nota"}
      </Button>
    </form>
  );
}
