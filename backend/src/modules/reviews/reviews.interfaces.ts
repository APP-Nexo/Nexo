export type CreateReviewPayload = {
    rating: number;
    text?: string | null;
};

export type UpdateReviewPayload = {
    rating?: number;
    text?: string | null;
};

export type CreateReportPayload = {
    reason: string;
};

export type GameIdParams = {
    gameId: number | string;
};

export type ReviewIdParams = {
    id: number | string;
};
