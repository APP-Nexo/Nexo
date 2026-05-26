import type { SearchUserResult } from '../../shared/dto/search.dto.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

type UserWithProfile = {
    id: number;
    name: string;
    username: string | null;
    profile: { photo: string | null; bio: string | null; followersCount: number } | null;
};

export class SearchService {
    static async searchUsers(query: string, cursor?: string, limit = 20) {
        if (!query || query.length < 2) return { data: [], total: 0 };

        const actualLimit = Math.min(limit, 50);

        const where = {
            activate: true,
            OR: [
                { name: { contains: query, mode: 'insensitive' as const } },
                ...(query.length >= 2
                    ? [{ username: { contains: query, mode: 'insensitive' as const } }]
                    : []),
            ],
        };

        const take = actualLimit + 1;
        const users = (await prisma.user.findMany({
            where,
            include: { profile: { select: { photo: true, bio: true, followersCount: true } } },
            orderBy: [{ username: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
            take,
            ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
        })) as unknown as UserWithProfile[];

        const data = users.slice(0, actualLimit).map((u) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            photo: u.profile?.photo ?? null,
            bio: u.profile?.bio ?? null,
            followersCount: u.profile?.followersCount ?? 0,
        })) satisfies SearchUserResult[];

        return { data, total: data.length };
    }
}
