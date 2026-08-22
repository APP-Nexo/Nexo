export type UserPublicProfile = {
    id: number;
    username: string;
    bio: string | null;
    photo: string | null;
    banner: string | null;
    followersCount: number;
    followingCount: number;
    createdAt: Date;
    isFollowing: boolean;
};

export type PublicGameSummary = {
    id: number;
    title: string;
    cover: string | null;
};

export type PublicUserReview = {
    id: number;
    userId: number;
    gameId: number;
    rating: number;
    text: string | null;
    status: 'approved';
    createdAt: Date;
    updatedAt: Date;
    game: PublicGameSummary;
};

export type PublicListItem = {
    id: number;
    listId: number;
    gameId: number;
    addedAt: Date;
    game: PublicGameSummary;
};

export type PublicUserList = {
    id: number;
    userId: number;
    name: string;
    isPublic: true;
    itemCount: number;
    createdAt: Date;
    updatedAt: Date;
    items: PublicListItem[];
};

export type UsersPaginationQuery = {
    cursor?: string | number;
};
