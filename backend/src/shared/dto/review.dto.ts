export type ReviewResponse = {
    id: number;
    userId: number;
    gameId: number;
    rating: number;
    text: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    user?: { id: number; name: string; username: string | null; photo: string | null };
    game?: { id: number; title: string; cover: string | null };
};

export type CreateReviewDTO = {
    gameId: number;
    rating: number;
    text?: string;
};

export type UpdateReviewDTO = {
    rating?: number;
    text?: string;
};
