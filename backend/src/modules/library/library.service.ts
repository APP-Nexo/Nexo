import type { Prisma } from '../../generated/client.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import { LibraryError } from './library.errors.js';
import type {
    CreateLibraryListPayload,
    GameSummaryDTO,
    LibraryFavoritesQuery,
    LibraryGameDTO,
    LibraryGameResponse,
    LibraryGamesQuery,
    LibraryGamesResponse,
    LibraryListDTO,
    LibraryListItemDTO,
    LibraryListItemResponse,
    LibraryListResponse,
    LibraryListsResponse,
    UpdateLibraryListPayload,
    UpsertLibraryGamePayload,
    UserGameStatus,
} from './library.interfaces.js';
import {
    LIBRARY_DEFAULT_LIMIT,
    LIBRARY_MAX_LIMIT,
    LIST_NAME_MAX_LENGTH,
    PRISMA_INT_MAX,
    USER_GAME_STATUSES,
} from './library.interfaces.js';

const GAME_SUMMARY_SELECT = {
    id: true,
    slug: true,
    title: true,
    cover: true,
    releaseDate: true,
    genres: true,
    platforms: true,
    averageRating: true,
} as const;

const USER_GAME_INCLUDE = {
    game: { select: GAME_SUMMARY_SELECT },
} as const;

const LIST_INCLUDE = {
    _count: { select: { items: true } },
    items: {
        include: { game: { select: GAME_SUMMARY_SELECT } },
        orderBy: { addedAt: 'desc' as const },
        take: 100,
    },
} as const;

type GameSummaryRecord = {
    id: number;
    slug: string;
    title: string;
    cover: string | null;
    releaseDate: Date | null;
    genres: string[];
    platforms: string[];
    averageRating: number;
};

type UserGameRecord = {
    id: number;
    gameId: number;
    status: UserGameStatus;
    isFavorite: boolean;
    progress: number | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    game: GameSummaryRecord;
};

type ListItemRecord = {
    id: number;
    listId: number;
    gameId: number;
    addedAt: Date;
    game: GameSummaryRecord;
};

type ListRecord = {
    id: number;
    name: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { items: number };
    items: ListItemRecord[];
};

function isPrismaError(error: unknown, ...codes: string[]) {
    if (typeof error !== 'object' || error === null) return false;
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' && codes.includes(code);
}

async function runLibraryTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(operation, { isolationLevel: 'Serializable' });
        } catch (error) {
            if (!isPrismaError(error, 'P2034') || attempt === 2) {
                if (isPrismaError(error, 'P2034')) {
                    LibraryError.throw('A operação concorrente não pôde ser concluída.', 409);
                }
                throw error;
            }
        }
    }

    throw new Error('Transaction retry limit reached.');
}

function assertPositiveInteger(value: number, field: string) {
    if (!Number.isSafeInteger(value) || value <= 0 || value > PRISMA_INT_MAX) {
        LibraryError.invalid(field);
    }
}

function assertStatus(status: unknown): asserts status is UserGameStatus {
    if (typeof status !== 'string' || !USER_GAME_STATUSES.includes(status as UserGameStatus)) {
        LibraryError.invalid('status');
    }
}

function assertProgress(progress: unknown): asserts progress is number {
    if (!Number.isInteger(progress) || (progress as number) < 0 || (progress as number) > 100) {
        LibraryError.throw('O progresso deve ser um número inteiro entre 0 e 100.', 400);
    }
}

function normalizeName(name: unknown) {
    if (typeof name !== 'string') LibraryError.invalid('name');

    const normalized = name.trim();
    if (normalized.length === 0 || normalized.length > LIST_NAME_MAX_LENGTH) {
        LibraryError.throw(
            `O nome da lista deve ter entre 1 e ${LIST_NAME_MAX_LENGTH} caracteres.`,
            400,
        );
    }
    return normalized;
}

function normalizeLimit(limit: number | undefined) {
    const normalized = limit ?? LIBRARY_DEFAULT_LIMIT;
    if (!Number.isInteger(normalized) || normalized < 1 || normalized > LIBRARY_MAX_LIMIT) {
        LibraryError.throw(`O limite deve estar entre 1 e ${LIBRARY_MAX_LIMIT}.`, 400);
    }
    return normalized;
}

function toGameSummary(game: GameSummaryRecord): GameSummaryDTO {
    return {
        id: game.id,
        slug: game.slug,
        title: game.title,
        cover: game.cover,
        releaseDate: game.releaseDate?.toISOString() ?? null,
        genres: game.genres,
        platforms: game.platforms,
        averageRating: game.averageRating,
    };
}

function toLibraryGame(entry: UserGameRecord): LibraryGameDTO {
    return {
        id: entry.id,
        gameId: entry.gameId,
        status: entry.status,
        isFavorite: entry.isFavorite,
        progress: entry.progress,
        startedAt: entry.startedAt?.toISOString() ?? null,
        completedAt: entry.completedAt?.toISOString() ?? null,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        game: toGameSummary(entry.game),
    };
}

function toListItem(item: ListItemRecord): LibraryListItemDTO {
    return {
        id: item.id,
        listId: item.listId,
        gameId: item.gameId,
        addedAt: item.addedAt.toISOString(),
        game: toGameSummary(item.game),
    };
}

function toList(list: ListRecord): LibraryListDTO {
    const items = list.items.map(toListItem);
    return {
        id: list.id,
        name: list.name,
        isPublic: list.isPublic,
        itemCount: list._count?.items ?? items.length,
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString(),
        items,
    };
}

async function ensureOwnedList(userId: number, listId: number) {
    const list = await prisma.userGameList.findFirst({
        where: { id: listId, userId },
        select: { id: true },
    });
    if (!list) LibraryError.listNotFound();
}

export class LibraryService {
    static async getGames(
        userId: number,
        query: LibraryGamesQuery = {},
    ): Promise<LibraryGamesResponse> {
        assertPositiveInteger(userId, 'userId');
        if (query.status !== undefined) assertStatus(query.status);
        if (query.favorite !== undefined && typeof query.favorite !== 'boolean') {
            LibraryError.invalid('favorite');
        }
        if (query.cursor !== undefined) assertPositiveInteger(query.cursor, 'cursor');
        const limit = normalizeLimit(query.limit);

        const entries = await prisma.userGame.findMany({
            where: {
                userId,
                ...(query.status !== undefined ? { status: query.status } : {}),
                ...(query.favorite !== undefined ? { isFavorite: query.favorite } : {}),
            },
            include: USER_GAME_INCLUDE,
            orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
            take: limit + 1,
            ...(query.cursor !== undefined ? { cursor: { id: query.cursor }, skip: 1 } : {}),
        });

        const hasMore = entries.length > limit;
        const page = entries.slice(0, limit);
        return {
            games: page.map((entry) => toLibraryGame(entry)),
            nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
        };
    }

    static async getFavorites(
        userId: number,
        query: LibraryFavoritesQuery = {},
    ): Promise<LibraryGamesResponse> {
        return LibraryService.getGames(userId, { ...query, favorite: true });
    }

    static async upsertGame(
        userId: number,
        gameId: number,
        payload: UpsertLibraryGamePayload,
    ): Promise<LibraryGameResponse> {
        assertPositiveInteger(userId, 'userId');
        assertPositiveInteger(gameId, 'gameId');
        if (
            !payload ||
            (payload.status === undefined &&
                payload.isFavorite === undefined &&
                payload.progress === undefined)
        ) {
            LibraryError.throw('Informe ao menos um campo para atualizar.', 400);
        }
        if (payload.status !== undefined) assertStatus(payload.status);
        if (payload.isFavorite !== undefined && typeof payload.isFavorite !== 'boolean') {
            LibraryError.invalid('isFavorite');
        }
        if (payload.progress !== undefined) assertProgress(payload.progress);

        try {
            return await runLibraryTransaction(async (tx) => {
                const [game, existing] = await Promise.all([
                    tx.game.findUnique({ where: { id: gameId }, select: { id: true } }),
                    tx.userGame.findUnique({
                        where: { userId_gameId: { userId, gameId } },
                        select: {
                            status: true,
                            isFavorite: true,
                            progress: true,
                            startedAt: true,
                            completedAt: true,
                        },
                    }),
                ]);
                if (!game) LibraryError.gameNotFound();

                const now = new Date();
                const status = payload.status ?? existing?.status ?? 'want_to_play';
                if (
                    payload.status === undefined &&
                    existing?.status === 'completed' &&
                    payload.progress !== undefined &&
                    payload.progress !== 100
                ) {
                    LibraryError.throw('Um jogo concluído deve permanecer com progresso 100.', 400);
                }

                const update: Record<string, unknown> = {};
                if (payload.isFavorite !== undefined) update.isFavorite = payload.isFavorite;
                if (payload.status !== undefined) {
                    update.status = status;
                    if (status === 'completed') {
                        update.progress = 100;
                        update.completedAt = existing?.completedAt ?? now;
                    } else {
                        update.completedAt = null;
                        update.progress =
                            payload.progress ??
                            (existing?.status === 'completed' ? null : existing?.progress);
                        if (status === 'playing') {
                            update.startedAt = existing?.startedAt ?? now;
                        } else if (status === 'want_to_play') {
                            update.startedAt = null;
                        }
                    }
                } else if (payload.progress !== undefined) {
                    update.progress = payload.progress;
                }

                const entry = await tx.userGame.upsert({
                    where: { userId_gameId: { userId, gameId } },
                    create: {
                        userId,
                        gameId,
                        status,
                        isFavorite: payload.isFavorite ?? false,
                        progress: status === 'completed' ? 100 : (payload.progress ?? null),
                        startedAt: status === 'playing' ? now : null,
                        completedAt: status === 'completed' ? now : null,
                    },
                    update,
                    include: USER_GAME_INCLUDE,
                });
                return { game: toLibraryGame(entry) };
            });
        } catch (error) {
            if (isPrismaError(error, 'P2003')) LibraryError.gameNotFound();
            throw error;
        }
    }

    static async deleteGame(userId: number, gameId: number): Promise<void> {
        assertPositiveInteger(userId, 'userId');
        assertPositiveInteger(gameId, 'gameId');

        await runLibraryTransaction(async (tx) => {
            const existing = await tx.userGame.findUnique({
                where: { userId_gameId: { userId, gameId } },
                select: { id: true },
            });
            if (!existing) LibraryError.ownedGameNotFound();

            await tx.userGameListItem.deleteMany({
                where: { gameId, list: { userId } },
            });
            await tx.userGame.delete({ where: { userId_gameId: { userId, gameId } } });
        });
    }

    static async getLists(userId: number): Promise<LibraryListsResponse> {
        assertPositiveInteger(userId, 'userId');
        const lists = await prisma.userGameList.findMany({
            where: { userId },
            include: LIST_INCLUDE,
            orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
            take: 50,
        });
        return { lists: lists.map((list) => toList(list)) };
    }

    static async createList(
        userId: number,
        payload: CreateLibraryListPayload,
    ): Promise<LibraryListResponse> {
        assertPositiveInteger(userId, 'userId');
        const name = normalizeName(payload?.name);
        if (payload.isPublic !== undefined && typeof payload.isPublic !== 'boolean') {
            LibraryError.invalid('isPublic');
        }

        try {
            const list = await prisma.userGameList.create({
                data: { userId, name, isPublic: payload.isPublic ?? true },
                include: LIST_INCLUDE,
            });
            return { list: toList(list) };
        } catch (error) {
            if (isPrismaError(error, 'P2002')) LibraryError.duplicateListName();
            throw error;
        }
    }

    static async updateList(
        userId: number,
        listId: number,
        payload: UpdateLibraryListPayload,
    ): Promise<LibraryListResponse> {
        assertPositiveInteger(userId, 'userId');
        assertPositiveInteger(listId, 'id');
        if (!payload || (payload.name === undefined && payload.isPublic === undefined)) {
            LibraryError.throw('Informe ao menos um campo para atualizar.', 400);
        }
        const name = payload.name !== undefined ? normalizeName(payload.name) : undefined;
        if (payload.isPublic !== undefined && typeof payload.isPublic !== 'boolean') {
            LibraryError.invalid('isPublic');
        }

        await ensureOwnedList(userId, listId);
        try {
            const list = await prisma.userGameList.update({
                where: { id: listId },
                data: {
                    ...(name !== undefined ? { name } : {}),
                    ...(payload.isPublic !== undefined ? { isPublic: payload.isPublic } : {}),
                },
                include: LIST_INCLUDE,
            });
            return { list: toList(list) };
        } catch (error) {
            if (isPrismaError(error, 'P2002')) LibraryError.duplicateListName();
            if (isPrismaError(error, 'P2025')) LibraryError.listNotFound();
            throw error;
        }
    }

    static async deleteList(userId: number, listId: number): Promise<void> {
        assertPositiveInteger(userId, 'userId');
        assertPositiveInteger(listId, 'id');

        const result = await prisma.userGameList.deleteMany({ where: { id: listId, userId } });
        if (result.count === 0) LibraryError.listNotFound();
    }

    static async addGameToList(
        userId: number,
        listId: number,
        gameId: number,
    ): Promise<LibraryListItemResponse> {
        assertPositiveInteger(userId, 'userId');
        assertPositiveInteger(listId, 'id');
        assertPositiveInteger(gameId, 'gameId');

        try {
            return await runLibraryTransaction(async (tx) => {
                const [list, ownedGame] = await Promise.all([
                    tx.userGameList.findFirst({
                        where: { id: listId, userId },
                        select: { id: true },
                    }),
                    tx.userGame.findUnique({
                        where: { userId_gameId: { userId, gameId } },
                        select: { id: true },
                    }),
                ]);
                if (!list) LibraryError.listNotFound();
                if (!ownedGame) LibraryError.ownedGameNotFound();

                const item = await tx.userGameListItem.upsert({
                    where: { listId_gameId: { listId, gameId } },
                    create: { listId, gameId },
                    update: {},
                    include: { game: { select: GAME_SUMMARY_SELECT } },
                });
                await tx.userGameList.update({
                    where: { id: listId },
                    data: { updatedAt: new Date() },
                });
                return { item: toListItem(item) };
            });
        } catch (error) {
            if (isPrismaError(error, 'P2002')) {
                const item = await prisma.userGameListItem.findUnique({
                    where: { listId_gameId: { listId, gameId } },
                    include: { game: { select: GAME_SUMMARY_SELECT } },
                });
                if (item) return { item: toListItem(item) };
            }
            if (isPrismaError(error, 'P2003', 'P2025')) {
                LibraryError.throw('Lista ou jogo não encontrado.', 404);
            }
            throw error;
        }
    }

    static async removeGameFromList(userId: number, listId: number, gameId: number): Promise<void> {
        assertPositiveInteger(userId, 'userId');
        assertPositiveInteger(listId, 'id');
        assertPositiveInteger(gameId, 'gameId');

        await runLibraryTransaction(async (tx) => {
            const list = await tx.userGameList.findFirst({
                where: { id: listId, userId },
                select: { id: true },
            });
            if (!list) LibraryError.listNotFound();
            await tx.userGameListItem.deleteMany({ where: { listId, gameId } });
            await tx.userGameList.update({
                where: { id: listId },
                data: { updatedAt: new Date() },
            });
        });
    }
}
