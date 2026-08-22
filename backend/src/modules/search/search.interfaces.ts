export type SearchUsersQuery = {
    q?: string;
    cursor?: number;
    limit?: number;
    suggested?: boolean;
};

export type SearchUser = {
    id: number;
    username: string;
    photo: string | null;
    bio: string | null;
    followersCount: number;
};

export type SearchUsersResponse = {
    data: SearchUser[];
    total: number;
    hasMore: boolean;
    nextCursor: string | null;
};
