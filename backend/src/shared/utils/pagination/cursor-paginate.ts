type CursorPaginateArgs<T> = {
    findMany: (args: {
        take: number;
        orderBy?: unknown;
        cursor?: { id: number };
        skip?: number;
    }) => Promise<T[]>;
    take: number;
    cursor: string | undefined;
    orderBy?: unknown;
};

type CursorPaginateResult<T> = {
    data: T[];
    nextCursor: number | null;
};

export async function cursorPaginate<T extends { id: number }>(
    args: CursorPaginateArgs<T>,
): Promise<CursorPaginateResult<T>> {
    const { findMany, take, cursor, orderBy } = args;
    const takeWithExtra = take + 1;

    const items = await findMany({
        take: takeWithExtra,
        orderBy,
        ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
    });

    const data = items.slice(0, take);
    const nextCursor = items.length === takeWithExtra ? (items[take]?.id ?? null) : null;

    return { data, nextCursor };
}
