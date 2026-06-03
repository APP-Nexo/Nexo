export type FeedItemDTO = {
    id: number;
    type: 'review' | 'follow';
    userId: number;
    userUsername: string | null;
    userPhoto: string | null;
    createdAt: Date;
    review?: {
        id: number;
        gameId: number;
        gameTitle: string;
        gameCover: string | null;
        rating: number;
        text: string | null;
    } | null;
    follow?: {
        targetId: number;
        targetUsername: string | null;
    } | null;
};
