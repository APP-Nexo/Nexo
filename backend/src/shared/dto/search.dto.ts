export type SearchUserResult = {
    id: number;
    username: string | null;
    photo: string | null;
    bio: string | null;
    followersCount: number;
};

export type SearchResult<T> = {
    data: T[];
    total: number;
    nextCursor: string | null;
};
