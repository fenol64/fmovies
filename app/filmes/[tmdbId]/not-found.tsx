import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MovieNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl">Filme não encontrado</h1>
      <p className="mt-3 text-muted-foreground">
        Esse título não está no catálogo nem no TMDB.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/filmes">Voltar aos filmes</Link>
      </Button>
    </div>
  );
}
