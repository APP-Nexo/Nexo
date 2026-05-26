export type GameSummaryDTO = {
    id: number;
    title: string;
    cover: string | null;
    genre: string | null;
    averageRating: number;
    releaseDate: Date | null;
};
