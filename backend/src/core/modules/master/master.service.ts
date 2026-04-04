import prisma from "../../shared/utils/prisma/prisma_conn.js";
import { MasterErrors } from "./master.errors.js";

export class MasterService {
	static async promoteUser(id: number) {
		await MasterErrors.ensureNotMaster(prisma.user, id);
		await MasterErrors.ensureUserExistById(prisma.user, id);

		const adminRole = await prisma.role.findUnique({
			where: { role: "admin" },
		});
		if (!adminRole) return;

		await MasterErrors.ensureRole(
			prisma.user,
			id,
			adminRole.id,
			"Usuário ja é admin.",
		);

		await prisma.user.update({
			where: { id },
			data: { roleId: adminRole.id },
		});

		const user = await prisma.vwUserPublic.findUnique({ where: { id } });
		return {
			message: "Usuário promovido para admin.",
			email: user?.email,
			role: "admin",
		};
	}

	static async demoteUser(id: number) {
		await MasterErrors.ensureNotMaster(prisma.user, id);
		await MasterErrors.ensureUserExistById(prisma.user, id);

		const userRole = await prisma.role.findUnique({ where: { role: "user" } });
		if (!userRole) return;

		await MasterErrors.ensureRole(
			prisma.user,
			id,
			userRole.id,
			"Usuário ja é user.",
		);

		await prisma.user.update({
			where: { id },
			data: { roleId: userRole.id },
		});

		const user = await prisma.vwUserPublic.findUnique({ where: { id } });
		return {
			message: "Usuário rebaixado para user.",
			email: user?.email,
			role: "user",
		};
	}

	static async banUser(id: number) {
		await MasterErrors.ensureNotMaster(prisma.user, id);
		await MasterErrors.ensureUserExistById(prisma.user, id);

		const user = await prisma.user.findUnique({ where: { id } });
		await prisma.user.update({
			where: { id },
			data: {
				activate: false,
				email: `banned_${id}_${user?.email}`,
				deletedAt: new Date(),
			},
		});

		return {
			message: "Usuário banido.",
			email: user?.email,
			bannedAt: new Date().toISOString(),
		};
	}
}
