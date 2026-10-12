export type MovieCardData = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: string | null;
  average: number | null;
  ratingCount: number;
  inCatalog: boolean;
};

export type MovieRating = {
  id: string;
  score: number;
  comment: string | null;
  author: string;
  userId: string;
  updatedAt: Date;
};

export type MovieView = {
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string | null;
  cached: boolean;
  ratings: MovieRating[];
};
