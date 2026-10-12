export type TasteDiveRecommendation = {
  name: string;
  teaser: string | null;
};

type TasteDiveResponse = {
  Similar?: {
    Results?: Array<{
      Name?: string;
      Type?: string;
      wTeaser?: string;
    }>;
  };
};

export async function similarMovies(title: string): Promise<
  | { ok: true; items: TasteDiveRecommendation[] }
  | { ok: false; message: string }
> {
  const key = process.env.TASTEDIVE_API_KEY;
  if (!key) {
    return {
      ok: false,
      message: "Recomendações indisponíveis. Defina TASTEDIVE_API_KEY.",
    };
  }

  const url = new URL("https://tastedive.com/api/similar");
  url.searchParams.set("q", `movie:${title}`);
  url.searchParams.set("type", "movie");
  url.searchParams.set("info", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("k", key);

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return {
        ok: false,
        message: "Não foi possível carregar as recomendações agora.",
      };
    }

    const data = (await response.json()) as TasteDiveResponse;
    const items = (data.Similar?.Results ?? [])
      .filter((item) => item.Name && item.Type === "movie")
      .filter((item) => item.Name!.toLowerCase() !== title.toLowerCase())
      .slice(0, 8)
      .map((item) => ({
        name: item.Name!,
        teaser: item.wTeaser?.trim() || null,
      }));

    return { ok: true, items };
  } catch {
    return {
      ok: false,
      message: "Não foi possível carregar as recomendações agora.",
    };
  }
}
