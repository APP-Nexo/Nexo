export type Game = {
  id: string;
  title: string;
  category: string;
  cover: string | null;
  isNew?: boolean;
  rating: number;
  genres: string[];
};