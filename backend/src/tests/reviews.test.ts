import fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => {
    const user = {
        findUnique: vi.fn(),
    };
    const game = {
        findUnique: vi.fn(),
        update: vi.fn(),
    };
    const review = {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    };
    const report = {
        findUnique: vi.fn(),
        create: vi.fn(),
    };
    const notification = {
        create: vi.fn(),
    };
    const tx = { user, game, review, report, notification };
    const transaction = vi.fn(async (operation: (client: typeof tx) => Promise<unknown>) =>
        operation(tx),
    );

    return { user, game, review, report, notification, tx, transaction };
});

vi.mock('../shared/utils/prisma/prisma_conn.js', () => ({
    default: {
        user: db.user,
        game: db.game,
        review: db.review,
        report: db.report,
        notification: db.notification,
        $transaction: db.transaction,
    },
}));

vi.mock('../shared/middlewares/check_token.js', () => ({
    checkToken: async (request: any) => {
        request.user = { id: 1, email: 'reviewer@nexo.test', roleId: 1 };
    },
}));

import { reviewsRoutes } from '../modules/reviews/reviews.routes.js';
import { errorHandler } from '../shared/errors/error_handler.js';

const timestamp = new Date('2026-08-21T12:00:00.000Z');
const deletedAt = new Date('2026-08-20T12:00:00.000Z');

function activeUser(overrides: Record<string, unknown> = {}) {
    return {
        activate: true,
        deletedAt: null,
        blockedUser: null,
        ...overrides,
    };
}

function reviewRecord(overrides: Record<string, unknown> = {}) {
    return {
        id: 7,
        userId: 1,
        gameId: 10,
        rating: 4,
        text: 'Otimo jogo',
        status: 'approved',
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        user: {
            id: 1,
            username: 'reviewer',
            profile: { photo: '/uploads/avatars/1.png' },
        },
        game: { id: 10, title: 'Nexo Quest', cover: '/covers/nexo.jpg' },
        ...overrides,
    };
}

function storedReview(overrides: Record<string, unknown> = {}) {
    return {
        id: 7,
        userId: 1,
        gameId: 10,
        rating: 4,
        text: 'Otimo jogo',
        status: 'approved',
        version: 1,
        createdAt: timestamp,
        deletedAt: null,
        ...overrides,
    };
}

function reportableReview(overrides: Record<string, unknown> = {}) {
    return {
        id: 8,
        userId: 2,
        rating: 4,
        text: 'Texto original da review',
        status: 'approved',
        version: 3,
        createdAt: timestamp,
        deletedAt: null,
        user: activeUser(),
        ...overrides,
    };
}

function reportRecord(overrides: Record<string, unknown> = {}) {
    return {
        id: 20,
        reporterId: 1,
        reviewId: 8,
        reason: 'conteudo ofensivo',
        reviewRating: 4,
        reviewText: 'Texto original da review',
        reviewCreatedAt: timestamp,
        reviewVersion: 3,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
        ...overrides,
    };
}

let app: FastifyInstance;

beforeAll(async () => {
    app = fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    await app.register(reviewsRoutes, { prefix: '/api/reviews' });
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    vi.resetAllMocks();
    db.transaction.mockImplementation(
        async (operation: (client: typeof db.tx) => Promise<unknown>) => operation(db.tx),
    );
    db.user.findUnique.mockResolvedValue(activeUser());
    db.notification.create.mockResolvedValue({});
});

describe('Reviews routes', () => {
    describe('POST /api/reviews/game/:gameId', () => {
        it('creates an approved review and atomically updates the game rating', async () => {
            db.game.findUnique.mockResolvedValueOnce({ id: 10 });
            db.review.findUnique.mockResolvedValueOnce(null);
            db.review.create.mockResolvedValueOnce(reviewRecord({ text: 'Otimo jogo' }));
            db.game.update.mockResolvedValueOnce({ ratingSum: 4, ratingCount: 1 });

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/game/10',
                headers: { authorization: 'Bearer token' },
                payload: { rating: 4, text: '  Otimo jogo  ' },
            });

            expect(response.statusCode).toBe(201);
            expect(response.json()).toMatchObject({
                id: 7,
                text: 'Otimo jogo',
                status: 'approved',
                version: 1,
                user: {
                    id: 1,
                    username: 'reviewer',
                    photo: '/uploads/avatars/1.png',
                },
                game: { id: 10, title: 'Nexo Quest', cover: '/covers/nexo.jpg' },
            });
            expect(db.review.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        userId: 1,
                        gameId: 10,
                        rating: 4,
                        text: 'Otimo jogo',
                        status: 'approved',
                    },
                }),
            );
            expect(db.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                select: {
                    activate: true,
                    deletedAt: true,
                    blockedUser: { select: { id: true } },
                },
            });
            expect(db.game.update).toHaveBeenNthCalledWith(1, {
                where: { id: 10 },
                data: { ratingSum: { increment: 4 }, ratingCount: { increment: 1 } },
                select: { ratingSum: true, ratingCount: true },
            });
            expect(db.game.update).toHaveBeenNthCalledWith(2, {
                where: { id: 10 },
                data: { averageRating: 4 },
            });
            expect(db.transaction).toHaveBeenCalledWith(expect.any(Function), {
                isolationLevel: 'Serializable',
            });
        });

        it('retries a serialization conflict and re-checks the account in the new transaction', async () => {
            let attempt = 0;
            db.transaction.mockImplementation(
                async (operation: (client: typeof db.tx) => Promise<unknown>) => {
                    const result = await operation(db.tx);
                    attempt += 1;
                    if (attempt === 1) throw { code: 'P2034' };
                    return result;
                },
            );
            db.game.findUnique.mockResolvedValue({ id: 10 });
            db.review.findUnique.mockResolvedValue(null);
            db.review.create.mockResolvedValue(reviewRecord());
            db.game.update.mockResolvedValue({ ratingSum: 4, ratingCount: 1 });

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/game/10',
                headers: { authorization: 'Bearer token' },
                payload: { rating: 4 },
            });

            expect(response.statusCode).toBe(201);
            expect(db.transaction).toHaveBeenCalledTimes(2);
            expect(db.transaction).toHaveBeenNthCalledWith(1, expect.any(Function), {
                isolationLevel: 'Serializable',
            });
            expect(db.transaction).toHaveBeenNthCalledWith(2, expect.any(Function), {
                isolationLevel: 'Serializable',
            });
            expect(db.user.findUnique).toHaveBeenCalledTimes(2);
            expect(db.review.create).toHaveBeenCalledTimes(2);
        });

        it('returns 404 when the game does not exist', async () => {
            db.game.findUnique.mockResolvedValueOnce(null);

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/game/999',
                headers: { authorization: 'Bearer token' },
                payload: { rating: 3 },
            });

            expect(response.statusCode).toBe(404);
            expect(db.review.create).not.toHaveBeenCalled();
            expect(db.user.findUnique).toHaveBeenCalledOnce();
            expect(db.transaction).toHaveBeenCalledWith(expect.any(Function), {
                isolationLevel: 'Serializable',
            });
        });

        it('returns 409 for a duplicate user and game review', async () => {
            db.game.findUnique.mockResolvedValueOnce({ id: 10 });
            db.review.findUnique.mockResolvedValueOnce({
                id: 7,
                deletedAt: null,
                _count: { reports: 0 },
            });

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/game/10',
                headers: { authorization: 'Bearer token' },
                payload: { rating: 3 },
            });

            expect(response.statusCode).toBe(409);
            expect(db.review.create).not.toHaveBeenCalled();
            expect(db.review.update).not.toHaveBeenCalled();
            expect(db.game.update).not.toHaveBeenCalled();
        });

        it('resurrects a soft-deleted review as a new version', async () => {
            db.game.findUnique.mockResolvedValueOnce({ id: 10 });
            db.review.findUnique.mockResolvedValueOnce({
                id: 7,
                deletedAt,
                _count: { reports: 0 },
            });
            db.review.update.mockResolvedValueOnce(
                reviewRecord({ rating: 5, text: 'Nova avaliacao', version: 4 }),
            );
            db.game.update.mockResolvedValueOnce({ ratingSum: 5, ratingCount: 1 });

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/game/10',
                headers: { authorization: 'Bearer token' },
                payload: { rating: 5, text: '  Nova avaliacao  ' },
            });

            expect(response.statusCode).toBe(201);
            expect(response.json()).toMatchObject({ id: 7, rating: 5, version: 4 });
            expect(db.review.findUnique).toHaveBeenCalledWith({
                where: { userId_gameId: { userId: 1, gameId: 10 } },
                select: {
                    id: true,
                    deletedAt: true,
                    _count: { select: { reports: { where: { status: 'pending' } } } },
                },
            });
            expect(db.review.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 7 },
                    data: {
                        rating: 5,
                        text: 'Nova avaliacao',
                        status: 'approved',
                        moderationReason: null,
                        deletedAt: null,
                        version: { increment: 1 },
                    },
                }),
            );
            expect(db.review.create).not.toHaveBeenCalled();
            expect(db.game.update).toHaveBeenNthCalledWith(1, {
                where: { id: 10 },
                data: { ratingSum: { increment: 5 }, ratingCount: { increment: 1 } },
                select: { ratingSum: true, ratingCount: true },
            });
        });

        it('does not resurrect a soft-deleted review with a pending report', async () => {
            db.game.findUnique.mockResolvedValueOnce({ id: 10 });
            db.review.findUnique.mockResolvedValueOnce({
                id: 7,
                deletedAt,
                _count: { reports: 1 },
            });

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/game/10',
                headers: { authorization: 'Bearer token' },
                payload: { rating: 5 },
            });

            expect(response.statusCode).toBe(409);
            expect(db.review.update).not.toHaveBeenCalled();
            expect(db.review.create).not.toHaveBeenCalled();
            expect(db.game.update).not.toHaveBeenCalled();
        });

        it.each([
            { state: 'inactive', account: activeUser({ activate: false }) },
            { state: 'deleted', account: activeUser({ deletedAt }) },
            { state: 'blocked', account: activeUser({ blockedUser: { id: 9 } }) },
        ])('rejects a $state requester using current database state', async ({ account }) => {
            db.user.findUnique.mockResolvedValueOnce(account);
            db.game.findUnique.mockResolvedValueOnce({ id: 10 });

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/game/10',
                headers: { authorization: 'Bearer stale-token' },
                payload: { rating: 4 },
            });

            expect(response.statusCode).toBe(403);
            expect(db.review.findUnique).not.toHaveBeenCalled();
            expect(db.review.create).not.toHaveBeenCalled();
            expect(db.review.update).not.toHaveBeenCalled();
            expect(db.game.update).not.toHaveBeenCalled();
            expect(db.transaction).toHaveBeenCalledWith(expect.any(Function), {
                isolationLevel: 'Serializable',
            });
        });

        it.each([0, 6, 2.5])('rejects invalid rating %s', async (rating) => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/game/10',
                headers: { authorization: 'Bearer token' },
                payload: { rating },
            });

            expect(response.statusCode).toBe(400);
            expect(db.transaction).not.toHaveBeenCalled();
        });

        it('rejects review text longer than 250 characters', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/game/10',
                headers: { authorization: 'Bearer token' },
                payload: { rating: 4, text: 'a'.repeat(251) },
            });

            expect(response.statusCode).toBe(400);
            expect(db.transaction).not.toHaveBeenCalled();
        });
    });

    describe('PATCH /api/reviews/:id', () => {
        it('updates the author review and applies only its approved rating delta', async () => {
            db.review.findUnique.mockResolvedValueOnce(storedReview({ rating: 2 }));
            db.review.update.mockResolvedValueOnce(
                reviewRecord({ rating: 5, text: 'Agora excelente', version: 2 }),
            );
            db.game.update.mockResolvedValueOnce({ ratingSum: 9, ratingCount: 2 });

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/reviews/7',
                headers: { authorization: 'Bearer token' },
                payload: { rating: 5, text: '  Agora excelente  ' },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toMatchObject({
                rating: 5,
                text: 'Agora excelente',
                version: 2,
                user: { username: 'reviewer' },
                game: { title: 'Nexo Quest' },
            });
            expect(db.review.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 7 },
                    data: {
                        rating: 5,
                        text: 'Agora excelente',
                        version: { increment: 1 },
                    },
                }),
            );
            expect(db.game.update).toHaveBeenNthCalledWith(1, {
                where: { id: 10 },
                data: { ratingSum: { increment: 3 } },
                select: { ratingSum: true, ratingCount: true },
            });
            expect(db.game.update).toHaveBeenNthCalledWith(2, {
                where: { id: 10 },
                data: { averageRating: 4.5 },
            });
            expect(db.user.findUnique).toHaveBeenCalledOnce();
            expect(db.transaction).toHaveBeenCalledWith(expect.any(Function), {
                isolationLevel: 'Serializable',
            });
        });

        it('does not add a rejected review to game aggregates', async () => {
            db.review.findUnique.mockResolvedValueOnce(
                storedReview({ rating: 2, status: 'rejected' }),
            );
            db.review.update.mockResolvedValueOnce(
                reviewRecord({ rating: 5, status: 'rejected', version: 2 }),
            );

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/reviews/7',
                headers: { authorization: 'Bearer token' },
                payload: { rating: 5 },
            });

            expect(response.statusCode).toBe(200);
            expect(db.review.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { rating: 5, version: { increment: 1 } },
                }),
            );
            expect(db.game.update).not.toHaveBeenCalled();
        });

        it('returns 403 when the requester is not the author', async () => {
            db.review.findUnique.mockResolvedValueOnce(storedReview({ userId: 2 }));

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/reviews/7',
                headers: { authorization: 'Bearer token' },
                payload: { rating: 5 },
            });

            expect(response.statusCode).toBe(403);
            expect(db.review.update).not.toHaveBeenCalled();
        });

        it('does not allow a soft-deleted review to be updated', async () => {
            db.review.findUnique.mockResolvedValueOnce(storedReview({ deletedAt }));

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/reviews/7',
                headers: { authorization: 'Bearer token' },
                payload: { rating: 5 },
            });

            expect(response.statusCode).toBe(404);
            expect(db.review.update).not.toHaveBeenCalled();
            expect(db.game.update).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /api/reviews/:id', () => {
        it('soft-deletes the author review and safely resets an empty game average', async () => {
            db.review.findUnique.mockResolvedValueOnce(storedReview());
            db.review.update.mockResolvedValueOnce({ id: 7 });
            db.game.update.mockResolvedValueOnce({ ratingSum: 0, ratingCount: 0 });

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/reviews/7',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(204);
            expect(response.body).toBe('');
            expect(db.review.update).toHaveBeenCalledWith({
                where: { id: 7 },
                data: { deletedAt: expect.any(Date) },
            });
            expect(db.review.delete).not.toHaveBeenCalled();
            expect(db.game.update).toHaveBeenNthCalledWith(1, {
                where: { id: 10 },
                data: { ratingSum: { decrement: 4 }, ratingCount: { decrement: 1 } },
                select: { ratingSum: true, ratingCount: true },
            });
            expect(db.game.update).toHaveBeenNthCalledWith(2, {
                where: { id: 10 },
                data: { averageRating: 0 },
            });
            expect(db.user.findUnique).toHaveBeenCalledOnce();
            expect(db.transaction).toHaveBeenCalledWith(expect.any(Function), {
                isolationLevel: 'Serializable',
            });
        });

        it('does not delete or adjust aggregates for an already soft-deleted review', async () => {
            db.review.findUnique.mockResolvedValueOnce(storedReview({ deletedAt }));

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/reviews/7',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(404);
            expect(db.review.update).not.toHaveBeenCalled();
            expect(db.review.delete).not.toHaveBeenCalled();
            expect(db.game.update).not.toHaveBeenCalled();
        });
    });

    describe('POST /api/reviews/:id/reports', () => {
        it('creates a versioned review snapshot and notifies the review author', async () => {
            db.review.findUnique.mockResolvedValueOnce(reportableReview());
            db.report.findUnique.mockResolvedValueOnce(null);
            db.report.create.mockResolvedValueOnce(reportRecord());

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/8/reports',
                headers: { authorization: 'Bearer token' },
                payload: { reason: '  conteudo ofensivo  ' },
            });

            expect(response.statusCode).toBe(201);
            expect(response.json()).toMatchObject({
                reporterId: 1,
                reviewId: 8,
                reason: 'conteudo ofensivo',
                reviewRating: 4,
                reviewText: 'Texto original da review',
                reviewCreatedAt: timestamp.toISOString(),
                reviewVersion: 3,
                status: 'pending',
            });
            expect(db.report.findUnique).toHaveBeenCalledWith({
                where: {
                    reporterId_reviewId_reviewVersion: {
                        reporterId: 1,
                        reviewId: 8,
                        reviewVersion: 3,
                    },
                },
                select: { id: true },
            });
            expect(db.report.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        reporterId: 1,
                        reviewId: 8,
                        reason: 'conteudo ofensivo',
                        reviewRating: 4,
                        reviewText: 'Texto original da review',
                        reviewCreatedAt: timestamp,
                        reviewVersion: 3,
                        status: 'pending',
                    },
                }),
            );
            expect(db.notification.create).toHaveBeenCalledWith({
                data: {
                    type: 'report',
                    toUserId: 2,
                    fromUserId: 1,
                    entityType: 'report',
                    entityId: 20,
                    metadata: { reviewId: 8, reviewVersion: 3 },
                },
            });
            expect(db.user.findUnique).toHaveBeenCalledOnce();
            expect(db.transaction).toHaveBeenCalledWith(expect.any(Function), {
                isolationLevel: 'Serializable',
            });
        });

        it('returns 409 for a duplicate report of the same review version', async () => {
            db.review.findUnique.mockResolvedValueOnce(reportableReview());
            db.report.findUnique.mockResolvedValueOnce({ id: 20 });

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/8/reports',
                headers: { authorization: 'Bearer token' },
                payload: { reason: 'motivo detalhado' },
            });

            expect(response.statusCode).toBe(409);
            expect(db.report.findUnique).toHaveBeenCalledWith({
                where: {
                    reporterId_reviewId_reviewVersion: {
                        reporterId: 1,
                        reviewId: 8,
                        reviewVersion: 3,
                    },
                },
                select: { id: true },
            });
            expect(db.report.create).not.toHaveBeenCalled();
            expect(db.notification.create).not.toHaveBeenCalled();
        });

        it('does not allow reporting the requester own review', async () => {
            db.review.findUnique.mockResolvedValueOnce(reportableReview({ userId: 1 }));

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/8/reports',
                headers: { authorization: 'Bearer token' },
                payload: { reason: 'motivo detalhado' },
            });

            expect(response.statusCode).toBe(400);
            expect(db.report.findUnique).not.toHaveBeenCalled();
            expect(db.report.create).not.toHaveBeenCalled();
            expect(db.notification.create).not.toHaveBeenCalled();
        });

        it('does not allow reporting a rejected review', async () => {
            db.review.findUnique.mockResolvedValueOnce(reportableReview({ status: 'rejected' }));

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/8/reports',
                headers: { authorization: 'Bearer token' },
                payload: { reason: 'motivo detalhado' },
            });

            expect(response.statusCode).toBe(400);
            expect(db.report.findUnique).not.toHaveBeenCalled();
            expect(db.report.create).not.toHaveBeenCalled();
            expect(db.notification.create).not.toHaveBeenCalled();
        });

        it.each([
            { state: 'inactive', account: activeUser({ activate: false }) },
            { state: 'deleted', account: activeUser({ deletedAt }) },
            { state: 'blocked', account: activeUser({ blockedUser: { id: 9 } }) },
        ])('does not allow reporting a review from a $state author', async ({ account }) => {
            db.review.findUnique.mockResolvedValueOnce(reportableReview({ user: account }));

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/8/reports',
                headers: { authorization: 'Bearer token' },
                payload: { reason: 'motivo detalhado' },
            });

            expect(response.statusCode).toBe(400);
            expect(db.report.findUnique).not.toHaveBeenCalled();
            expect(db.report.create).not.toHaveBeenCalled();
            expect(db.notification.create).not.toHaveBeenCalled();
        });

        it('re-checks the reporter account and rejects a blocked stale-token user', async () => {
            db.user.findUnique.mockResolvedValueOnce(activeUser({ blockedUser: { id: 9 } }));

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/8/reports',
                headers: { authorization: 'Bearer stale-token' },
                payload: { reason: 'motivo detalhado' },
            });

            expect(response.statusCode).toBe(403);
            expect(db.review.findUnique).not.toHaveBeenCalled();
            expect(db.report.findUnique).not.toHaveBeenCalled();
            expect(db.report.create).not.toHaveBeenCalled();
            expect(db.notification.create).not.toHaveBeenCalled();
            expect(db.transaction).toHaveBeenCalledWith(expect.any(Function), {
                isolationLevel: 'Serializable',
            });
        });

        it('does not allow reporting a soft-deleted review', async () => {
            db.review.findUnique.mockResolvedValueOnce(reportableReview({ deletedAt }));

            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/8/reports',
                headers: { authorization: 'Bearer token' },
                payload: { reason: 'motivo detalhado' },
            });

            expect(response.statusCode).toBe(404);
            expect(db.report.findUnique).not.toHaveBeenCalled();
            expect(db.report.create).not.toHaveBeenCalled();
            expect(db.notification.create).not.toHaveBeenCalled();
        });

        it('validates reason length after trimming', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/reviews/8/reports',
                headers: { authorization: 'Bearer token' },
                payload: { reason: '          ' },
            });

            expect(response.statusCode).toBe(400);
            expect(db.review.findUnique).not.toHaveBeenCalled();
            expect(db.transaction).not.toHaveBeenCalled();
        });
    });
});
