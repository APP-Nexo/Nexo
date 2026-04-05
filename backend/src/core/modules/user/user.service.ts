import { Prisma } from '../../generated/client.js';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import type { UserPayload } from '../auth/auth.interfaces.js';
import { UserErrors } from './user.errors.js';
import type { DeleteUserResponse, UserResponse } from './user.interfaces.js';
export class UserService {
    static async searchUser(tokenUser: UserPayload, find?: string, cursor?: string) {
        if (!find) return { users: [], nextCursor: null };

        const where = {
            OR: [
                { name: { startsWith: find, mode: Prisma.QueryMode.insensitive } },
                { friendlyId: { equals: find } },
            ],
        };

        const [users, total] = await Promise.all([
            prisma.vwUserPublic.findMany({
                where,
                select: {
                    id: true,
                    friendlyId: true,
                    createdAt: true,
                    name: true,
                    email: true,
                    photo: true,
                },
                orderBy: { name: 'asc' },
                take: 11,
                ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
            }),
            prisma.vwUserPublic.count({ where }),
        ]);

        const data = users.slice(0, 10);

        const following = await prisma.userFollow.findMany({
            where: {
                followerId: tokenUser.id,
                followingId: { in: data.map((u: { id: number }) => u.id) },
            },
            select: { followingId: true },
        });

        const followingIds = new Set(following.map((f: { followingId: number }) => f.followingId));
        const nextCursor = users.length === 11 ? (users[10]?.id ?? null) : null;

        return {
            users: data.map((user: { id: number } & Record<string, unknown>) => ({
                ...user,
                isFollowing: followingIds.has(user.id),
            })),
            nextCursor,
            total,
        };
    }

    static async getUser(tokenUser: UserPayload, id: number): Promise<UserResponse> {
        await UserErrors.ensureUserExistById(prisma.vwUserPublic, id);

        const user = await prisma.vwUserPublic.findUnique({ where: { id } });

        const isFollowing = await prisma.userFollow.findFirst({
            where: { followerId: tokenUser.id, followingId: id },
        });

        const {
            photo,
            banner,
            bio,
            config,
            friendlyId,
            followersCount,
            followingCount,
            ...userData
        } = user as any;

        return {
            user: { ...userData, isFollowing: !!isFollowing },
            profile: {
                friendlyId,
                photo,
                banner,
                bio,
                config,
                followersCount,
                followingCount,
            },
        };
    }

    static async deleteUser(
        tokenUser: UserTokenPayload,
        email: string,
    ): Promise<DeleteUserResponse> {
        UserErrors.ensureDelete(email, tokenUser);
        await UserErrors.ensureNotMaster(Number(tokenUser.id));
        await UserErrors.ensureUserExistById(prisma.vwUserPublic, tokenUser.id);

        await prisma.user.update({
            where: { id: tokenUser.id },
            data: {
                activate: false,
                email: `deleted_${tokenUser.id}_${tokenUser.email}`,
                deletedAt: new Date(),
            },
        });

        return {
            message: 'Conta deletada.',
            deletedAt: new Date().toISOString(),
            email: tokenUser.email,
        };
    }

    static async getFollowers(tokenUser: UserPayload, cursor?: string) {
        await UserErrors.ensureUserExistById(prisma.vwUserPublic, tokenUser.id);

        const follows = await prisma.userFollow.findMany({
            where: { followingId: tokenUser.id },
            orderBy: { timestamp: 'desc' },
            take: 11,
            ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
        });

        const data = follows.slice(0, 10);
        const followerIds = data.map((f) => f.followerId);

        const users = await prisma.vwUserPublic.findMany({
            where: { id: { in: followerIds } },
            select: {
                id: true,
                name: true,
                email: true,
                friendlyId: true,
                photo: true,
                createdAt: true,
            },
        });

        const followingBack = await prisma.userFollow.findMany({
            where: {
                followerId: tokenUser.id,
                followingId: { in: followerIds },
            },
            select: { followingId: true },
        });

        const followingIds = new Set(followingBack.map((f) => f.followingId));
        const nextCursor = follows.length === 11 ? (follows[10]?.id ?? null) : null;

        return {
            followers: users.map((user) => ({
                ...user,
                isFollowing: followingIds.has(user.id),
            })),
            nextCursor,
        };
    }

    static async getFollowings(tokenUser: UserPayload, cursor?: string) {
        await UserErrors.ensureUserExistById(prisma.vwUserPublic, tokenUser.id);

        const follows = await prisma.userFollow.findMany({
            where: { followerId: tokenUser.id },
            orderBy: { timestamp: 'desc' },
            take: 11,
            ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
        });

        const data = follows.slice(0, 10);
        const followingIds = data.map((f) => f.followingId);

        const users = await prisma.vwUserPublic.findMany({
            where: { id: { in: followingIds } },
            select: {
                id: true,
                name: true,
                email: true,
                friendlyId: true,
                photo: true,
                createdAt: true,
            },
        });

        const followingBack = await prisma.userFollow.findMany({
            where: {
                followerId: tokenUser.id,
                followingId: { in: followingIds },
            },
            select: { followingId: true },
        });

        const followingBackIds = new Set(followingBack.map((f) => f.followingId));
        const nextCursor = follows.length === 11 ? (follows[10]?.id ?? null) : null;

        return {
            followings: users.map((user) => ({
                ...user,
                isFollowing: followingBackIds.has(user.id),
            })),
            nextCursor,
        };
    }
}
