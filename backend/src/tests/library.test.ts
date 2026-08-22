import type { FastifyInstance } from 'fastify';
import fastify from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { checkTokenMock } = vi.hoisted(() => ({
    checkTokenMock: vi.fn(async (req: any) => {
        req.user = { id: 1, email: 'library@email.com', roleId: 1 };
    }),
}));

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: {
        game: { findUnique: vi.fn() },
        userGame: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            upsert: vi.fn(),
            delete: vi.fn(),
        },
        userGameList: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            deleteMany: vi.fn(),
        },
        userGameListItem: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
            deleteMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock('../shared/middlewares/check_token.js', () => ({ checkToken: checkTokenMock }));

import { libraryRoutes } from '../modules/library/library.routes.js';
import { errorHandler } from '../shared/errors/error_handler.js';
import prisma from '../shared/utils/prisma/prisma_conn.js';

const date = new Date('2026-08-21T12:00:00.000Z');

function game(id = 10) {
    return {
        id,
        slug: `game-${id}`,
        title: `Game ${id}`,
        cover: null,
        releaseDate: null,
        genres: ['RPG'],
        platforms: ['PC'],
        averageRating: 8.5,
    };
}

function libraryGame(
    overrides: Partial<{
        id: number;
        gameId: number;
        status: 'want_to_play' | 'playing' | 'completed' | 'tried' | 'abandoned';
        isFavorite: boolean;
        progress: number | null;
        startedAt: Date | null;
        completedAt: Date | null;
    }> = {},
) {
    const gameId = overrides.gameId ?? 10;
    return {
        id: overrides.id ?? 100,
        userId: 1,
        gameId,
        status: overrides.status ?? ('want_to_play' as const),
        isFavorite: overrides.isFavorite ?? false,
        progress: overrides.progress ?? null,
        startedAt: overrides.startedAt ?? null,
        completedAt: overrides.completedAt ?? null,
        createdAt: date,
        updatedAt: date,
        game: game(gameId),
    };
}

function listItem(id = 300, listId = 20, gameId = 10) {
    return { id, listId, gameId, addedAt: date, game: game(gameId) };
}

function gameList(
    overrides: Partial<{
        id: number;
        name: string;
        isPublic: boolean;
        items: ReturnType<typeof listItem>[];
    }> = {},
) {
    return {
        id: overrides.id ?? 20,
        userId: 1,
        name: overrides.name ?? 'Favoritos locais',
        isPublic: overrides.isPublic ?? true,
        createdAt: date,
        updatedAt: date,
        items: overrides.items ?? [],
    };
}

let app: FastifyInstance;

beforeAll(async () => {
    app = fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    await app.register(libraryRoutes, { prefix: '/api/library' });
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation((async (
        callback: (client: typeof prisma) => Promise<unknown>,
    ) => callback(prisma)) as never);
    vi.mocked(prisma.userGame.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userGameList.findMany).mockResolvedValue([]);
});

describe('Library routes', () => {
    it('lista jogos com filtros e paginação por cursor', async () => {
        vi.mocked(prisma.userGame.findMany).mockResolvedValueOnce([
            libraryGame({ id: 12, gameId: 12, status: 'playing', isFavorite: true }),
            libraryGame({ id: 11, gameId: 11, status: 'playing', isFavorite: true }),
            libraryGame({ id: 10, gameId: 10, status: 'playing', isFavorite: true }),
        ] as any);

        const response = await app.inject({
            method: 'GET',
            url: '/api/library/games?status=playing&favorite=true&cursor=13&limit=2',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
            games: [
                { id: 12, gameId: 12, status: 'playing', game: { title: 'Game 12' } },
                { id: 11, gameId: 11, status: 'playing', game: { title: 'Game 11' } },
            ],
            nextCursor: 11,
        });
        expect(prisma.userGame.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: 1, status: 'playing', isFavorite: true },
                cursor: { id: 13 },
                skip: 1,
                take: 3,
            }),
        );
        expect(checkTokenMock).toHaveBeenCalled();
    });

    it('expõe favoritos somente pelo filtro do usuário autenticado', async () => {
        await app.inject({
            method: 'GET',
            url: '/api/library/favorites?status=completed&limit=10',
            headers: { authorization: 'Bearer token' },
        });

        expect(prisma.userGame.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: 1, status: 'completed', isFavorite: true },
                take: 11,
            }),
        );
    });

    it.each([
        ['GET', '/api/library/games?status=invalid', undefined],
        ['GET', '/api/library/games?limit=51', undefined],
        ['PUT', '/api/library/games/0', { status: 'playing' }],
        ['PUT', '/api/library/games/2147483648', { status: 'playing' }],
        ['PUT', '/api/library/games/10', { progress: 101 }],
        ['PUT', '/api/library/games/10', {}],
        ['POST', '/api/library/lists', { name: '   ' }],
        ['PATCH', '/api/library/lists/1', {}],
    ] as const)('rejeita entrada inválida em %s %s', async (method, url, payload) => {
        const response = await app.inject({
            method,
            url,
            headers: { authorization: 'Bearer token' },
            ...(payload !== undefined ? { payload } : {}),
        });

        expect(response.statusCode).toBe(400);
    });

    it('conclui um jogo com progresso e timestamps coerentes', async () => {
        const startedAt = new Date('2026-08-20T10:00:00.000Z');
        vi.mocked(prisma.game.findUnique).mockResolvedValueOnce({ id: 10 } as any);
        vi.mocked(prisma.userGame.findUnique).mockResolvedValueOnce({
            status: 'playing',
            startedAt,
            completedAt: null,
        } as any);
        vi.mocked(prisma.userGame.upsert).mockResolvedValueOnce(
            libraryGame({
                status: 'completed',
                isFavorite: true,
                progress: 100,
                startedAt,
                completedAt: date,
            }) as any,
        );

        const response = await app.inject({
            method: 'PUT',
            url: '/api/library/games/10',
            headers: { authorization: 'Bearer token' },
            payload: { status: 'completed', progress: 30, isFavorite: true },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().game).toMatchObject({
            status: 'completed',
            progress: 100,
            isFavorite: true,
            completedAt: date.toISOString(),
        });
        expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
            isolationLevel: 'Serializable',
        });
        expect(prisma.userGame.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                update: expect.objectContaining({
                    status: 'completed',
                    progress: 100,
                    isFavorite: true,
                    completedAt: expect.any(Date),
                }),
            }),
        );
    });

    it('define startedAt ao jogar e limpa completedAt ao sair de concluído', async () => {
        vi.mocked(prisma.game.findUnique).mockResolvedValueOnce({ id: 10 } as any);
        vi.mocked(prisma.userGame.findUnique).mockResolvedValueOnce({
            status: 'completed',
            startedAt: null,
            completedAt: date,
        } as any);
        vi.mocked(prisma.userGame.upsert).mockResolvedValueOnce(
            libraryGame({ status: 'playing', progress: 100, startedAt: date }) as any,
        );

        const response = await app.inject({
            method: 'PUT',
            url: '/api/library/games/10',
            headers: { authorization: 'Bearer token' },
            payload: { status: 'playing' },
        });

        expect(response.statusCode).toBe(200);
        expect(prisma.userGame.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                update: expect.objectContaining({
                    status: 'playing',
                    startedAt: expect.any(Date),
                    completedAt: null,
                }),
            }),
        );
    });

    it('remove o jogo próprio e limpa seus itens de lista na mesma transação', async () => {
        vi.mocked(prisma.userGame.findUnique).mockResolvedValueOnce({ id: 100 } as any);
        vi.mocked(prisma.userGameListItem.deleteMany).mockResolvedValueOnce({ count: 2 });
        vi.mocked(prisma.userGame.delete).mockResolvedValueOnce(libraryGame() as any);

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/library/games/10',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(204);
        expect(response.body).toBe('');
        expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
            isolationLevel: 'Serializable',
        });
        expect(prisma.userGame.findUnique).toHaveBeenCalledWith({
            where: { userId_gameId: { userId: 1, gameId: 10 } },
            select: { id: true },
        });
        expect(prisma.userGameListItem.deleteMany).toHaveBeenCalledWith({
            where: { gameId: 10, list: { userId: 1 } },
        });
        expect(prisma.userGame.delete).toHaveBeenCalledWith({
            where: { userId_gameId: { userId: 1, gameId: 10 } },
        });
        expect(
            vi.mocked(prisma.userGameListItem.deleteMany).mock.invocationCallOrder[0]!,
        ).toBeLessThan(vi.mocked(prisma.userGame.delete).mock.invocationCallOrder[0]!);
    });

    it('não revela um jogo que pertence a outra biblioteca', async () => {
        vi.mocked(prisma.userGame.findUnique).mockResolvedValueOnce(null);

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/library/games/10',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ code: 'LibraryError' });
        expect(prisma.userGame.findUnique).toHaveBeenCalledWith({
            where: { userId_gameId: { userId: 1, gameId: 10 } },
            select: { id: true },
        });
        expect(prisma.userGameListItem.deleteMany).not.toHaveBeenCalled();
        expect(prisma.userGame.delete).not.toHaveBeenCalled();
    });

    it('lista inclusive listas privadas, sempre limitadas ao próprio usuário', async () => {
        vi.mocked(prisma.userGameList.findMany).mockResolvedValueOnce([
            gameList({ isPublic: false, items: [listItem()] }),
        ] as any);

        const response = await app.inject({
            method: 'GET',
            url: '/api/library/lists',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().lists[0]).toMatchObject({
            id: 20,
            isPublic: false,
            itemCount: 1,
            items: [{ gameId: 10 }],
        });
        expect(prisma.userGameList.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: 1 } }),
        );
    });

    it('cria lista com nome normalizado e responde 201', async () => {
        vi.mocked(prisma.userGameList.create).mockResolvedValueOnce(
            gameList({ name: 'Minha lista', isPublic: false }) as any,
        );

        const response = await app.inject({
            method: 'POST',
            url: '/api/library/lists',
            headers: { authorization: 'Bearer token' },
            payload: { name: '  Minha lista  ', isPublic: false },
        });

        expect(response.statusCode).toBe(201);
        expect(response.json().list).toMatchObject({ name: 'Minha lista', isPublic: false });
        expect(prisma.userGameList.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { userId: 1, name: 'Minha lista', isPublic: false },
            }),
        );
    });

    it('converte conflito de nome de lista em 409', async () => {
        vi.mocked(prisma.userGameList.create).mockRejectedValueOnce({ code: 'P2002' });

        const response = await app.inject({
            method: 'POST',
            url: '/api/library/lists',
            headers: { authorization: 'Bearer token' },
            payload: { name: 'Duplicada' },
        });

        expect(response.statusCode).toBe(409);
        expect(response.json()).toMatchObject({
            code: 'LibraryError',
            message: 'Já existe uma lista com este nome.',
        });
    });

    it('não atualiza nem revela lista de outro usuário', async () => {
        vi.mocked(prisma.userGameList.findFirst).mockResolvedValueOnce(null);

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/library/lists/20',
            headers: { authorization: 'Bearer token' },
            payload: { isPublic: true },
        });

        expect(response.statusCode).toBe(404);
        expect(prisma.userGameList.findFirst).toHaveBeenCalledWith({
            where: { id: 20, userId: 1 },
            select: { id: true },
        });
        expect(prisma.userGameList.update).not.toHaveBeenCalled();
    });

    it('atualiza lista própria com nome normalizado', async () => {
        vi.mocked(prisma.userGameList.findFirst).mockResolvedValueOnce({ id: 20 } as any);
        vi.mocked(prisma.userGameList.update).mockResolvedValueOnce(
            gameList({ name: 'Novo nome', isPublic: false }) as any,
        );

        const response = await app.inject({
            method: 'PATCH',
            url: '/api/library/lists/20',
            headers: { authorization: 'Bearer token' },
            payload: { name: '  Novo nome  ', isPublic: false },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().list).toMatchObject({ name: 'Novo nome', isPublic: false });
        expect(prisma.userGameList.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 20 },
                data: { name: 'Novo nome', isPublic: false },
            }),
        );
    });

    it('exclui lista com filtro de ownership e responde 204', async () => {
        vi.mocked(prisma.userGameList.deleteMany).mockResolvedValueOnce({ count: 1 });

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/library/lists/20',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(204);
        expect(prisma.userGameList.deleteMany).toHaveBeenCalledWith({
            where: { id: 20, userId: 1 },
        });
    });

    it('adiciona jogo próprio à lista de forma idempotente', async () => {
        vi.mocked(prisma.userGameList.findFirst).mockResolvedValue({ id: 20 } as any);
        vi.mocked(prisma.userGame.findUnique).mockResolvedValue({ id: 100 } as any);
        vi.mocked(prisma.userGameListItem.upsert).mockResolvedValue(listItem() as any);
        vi.mocked(prisma.userGameList.update).mockResolvedValue({} as any);

        const first = await app.inject({
            method: 'PUT',
            url: '/api/library/lists/20/games/10',
            headers: { authorization: 'Bearer token' },
        });
        const second = await app.inject({
            method: 'PUT',
            url: '/api/library/lists/20/games/10',
            headers: { authorization: 'Bearer token' },
        });

        expect(first.statusCode).toBe(200);
        expect(second.statusCode).toBe(200);
        expect(first.json()).toEqual(second.json());
        expect(prisma.$transaction).toHaveBeenCalledTimes(2);
        expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
            isolationLevel: 'Serializable',
        });
        expect(prisma.userGameListItem.upsert).toHaveBeenCalledTimes(2);
        expect(prisma.userGameListItem.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { listId_gameId: { listId: 20, gameId: 10 } },
                update: {},
            }),
        );
        expect(prisma.userGameList.update).toHaveBeenCalledTimes(2);
        expect(prisma.userGameList.update).toHaveBeenCalledWith({
            where: { id: 20 },
            data: { updatedAt: expect.any(Date) },
        });
    });

    it('não adiciona o jogo quando a lista não pertence ao usuário', async () => {
        vi.mocked(prisma.userGameList.findFirst).mockResolvedValueOnce(null);

        const response = await app.inject({
            method: 'PUT',
            url: '/api/library/lists/99/games/10',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(404);
        expect(prisma.userGameList.findFirst).toHaveBeenCalledWith({
            where: { id: 99, userId: 1 },
            select: { id: true },
        });
        expect(prisma.userGame.findUnique).toHaveBeenCalledWith({
            where: { userId_gameId: { userId: 1, gameId: 10 } },
            select: { id: true },
        });
        expect(prisma.userGameListItem.upsert).not.toHaveBeenCalled();
        expect(prisma.userGameList.update).not.toHaveBeenCalled();
    });

    it('remove item inexistente de forma idempotente', async () => {
        vi.mocked(prisma.userGameList.findFirst).mockResolvedValueOnce({ id: 20 } as any);
        vi.mocked(prisma.userGameListItem.deleteMany).mockResolvedValueOnce({ count: 0 });
        vi.mocked(prisma.userGameList.update).mockResolvedValueOnce({} as any);

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/library/lists/20/games/10',
            headers: { authorization: 'Bearer token' },
        });

        expect(response.statusCode).toBe(204);
        expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
            isolationLevel: 'Serializable',
        });
        expect(prisma.userGameList.findFirst).toHaveBeenCalledWith({
            where: { id: 20, userId: 1 },
            select: { id: true },
        });
        expect(prisma.userGameListItem.deleteMany).toHaveBeenCalledWith({
            where: { listId: 20, gameId: 10 },
        });
        expect(prisma.userGameList.update).toHaveBeenCalledWith({
            where: { id: 20 },
            data: { updatedAt: expect.any(Date) },
        });
    });
});
