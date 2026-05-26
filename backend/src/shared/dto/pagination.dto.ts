export type PaginatedCursorResponse<T> = {
    data: T[];
    nextCursor: number | null;
};

export type PaginatedResponse<T> = {
    users: T[];
    nextCursor: number | null;
};

export type UsersListResponse<T> = {
    users: T[];
    nextCursor: number | null;
};

export type UsersListTotalResponse<T> = {
    users: T[];
    nextCursor: number | null;
    total: number;
};
