import { Prisma } from "../../generated/client.js";
import type { UserTokenPayload } from "../../shared/utils/jwt/jwt.interfaces.js";
import prisma from "../../shared/utils/prisma/prisma_conn.js";
import type { UserPayload } from "../auth/auth.interfaces.js";
import { UserErrors } from "./user.errors.js";

export class UserService {
	static async searchUser(
		tokenUser: UserPayload,
		find?: string,
		cursor?: string,
	) {
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
				orderBy: { name: "asc" },
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

		const followingIds = new Set(
			following.map((f: { followingId: number }) => f.followingId),
		);
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

	static async getUser(tokenUser: UserPayload, id: number) {
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

	static async deleteUser(tokenUser: UserTokenPayload, email: string) {
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
			message: "Conta deletada.",
			deletedAt: new Date().toISOString(),
			email: tokenUser.email,
		};
	}
}
