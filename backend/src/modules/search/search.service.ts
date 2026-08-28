import type { Prisma } from '../../generated/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { normalizePrismaCursor } from '../../shared/infrastructure/validation/prisma-values.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import type { SearchUser, SearchUsersResponse } from './search.interfaces.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
function normalizeLimit(limit: number | undefined): number {
    const value = limit ?? DEFAULT_LIMIT;
    if (!Number.isInteger(value) || value < 1) {
        AppError.throw('O limite deve ser um número inteiro positivo.', 400);
    }
    return Math.min(value, MAX_LIMIT);
}

export class SearchService {
    static async searchUsers(
        query?: string,
        cursor?: string | number,
        limit?: number,
        suggested = false,
    ): Promise<SearchUsersResponse> {
        const normalizedQuery = query?.trim() ?? '';
        if (normalizedQuery.length === 0 && !suggested) {
            AppError.throw('Informe uma busca com ao menos 2 caracteres.', 400);
        }
        if (normalizedQuery.length === 1) {
            AppError.throw('A busca deve ter ao menos 2 caracteres.', 400);
        }

        const actualLimit = normalizeLimit(limit);
        const normalizedCursor = normalizePrismaCursor(cursor);
        const cursorId = normalizedCursor === undefined ? undefined : Number(normalizedCursor);
        const where: Prisma.UserWhereInput = {
            activate: true,
            deletedAt: null,
            blockedUser: null,
            ...(normalizedQuery
                ? { username: { contains: normalizedQuery, mode: 'insensitive' } }
                : {}),
        };
        const orderBy: Prisma.UserOrderByWithRelationInput[] = normalizedQuery
            ? [{ username: 'asc' }, { id: 'asc' }]
            : [{ profile: { followersCount: 'desc' } }, { id: 'desc' }];

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    username: true,
                    profile: {
                        select: { photo: true, bio: true, followersCount: true },
                    },
                },
                orderBy,
                take: actualLimit + 1,
                ...(cursorId !== undefined ? { cursor: { id: cursorId }, skip: 1 } : {}),
            }),
            prisma.user.count({ where }),
        ]);

        const hasMore = users.length > actualLimit;
        const page = users.slice(0, actualLimit);
        const data: SearchUser[] = page.map((user) => ({
            id: user.id,
            username: user.username,
            photo: user.profile?.photo ?? null,
            bio: user.profile?.bio ?? null,
            followersCount: user.profile?.followersCount ?? 0,
        }));

        return {
            data,
            total,
            hasMore,
            nextCursor: hasMore ? String(page.at(-1)!.id) : null,
        };
    }
}
