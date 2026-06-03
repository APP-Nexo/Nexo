export type SearchByEmailPayload = {
    q: string;
    cursor?: string;
};

export type PaginationPayload = {
    cursor?: string;
    limit?: number;
};

export type UserPublicSelect = {
    id: number;
    email: string;
    photo: string | null;
    createdAt: Date;
    roleId: number;
};

export type PaginatedResponse<T> = {
    users: T[];
    nextCursor: number | null;
};

export type UsersStatsResponse = {
    usersStatus: object | null;
};
