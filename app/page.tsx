import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Crie a sua conta",
    text: "Um nome, um e-mail e uma senha. A sala fica aberta para quem quiser ler.",
  },
  {
    number: "02",
    title: "Adicione um filme",
    text: "A busca olha o catálogo. Se o título ainda não estiver lá, ele vem do TMDB.",
  },
  {
    number: "03",
    title: "Publique a sua nota",
    text: "De 1 a 10, com um comentário se quiser. A ficha fica salva para a próxima visita.",
  },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 h-[28rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-20">
          <p className="text-sm tracking-[0.2em] text-primary uppercase">Sala de cinema</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
            Notas de quem sentou na sala.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Guarde o filme, deixe uma nota de 1 a 10 e veja títulos parecidos com o
            que você acabou de avaliar.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/filmes">Ver filmes</Link>
            </Button>
            {session?.user ? null : (
              <Button size="lg" variant="outline" asChild>
                <Link href="/registro">Criar conta</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 md:grid-cols-3">
        {steps.map((step) => (
          <article key={step.number} className="rounded-xl border border-border bg-card p-6">
            <p className="font-serif text-2xl text-primary">{step.number}</p>
            <h2 className="mt-4 font-serif text-2xl">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
