import type { FastifyReply } from "fastify";
import { comparePassword } from "../../shared/utils/bcrypt/compare_password.js";
import { encryptPassword } from "../../shared/utils/bcrypt/encrypt_password.js";
import { JwtToken } from "../../shared/utils/jwt/jwt_token.js";
import prisma from "../../shared/utils/prisma/prisma_conn.js";
import { AuthErrors } from "./auth.errors.js";
import type { RegisterPayload, UserPayload } from "./auth.interfaces.js";

export class AuthService {
	static async register(payload: RegisterPayload, reply: FastifyReply) {
		const { name, email, password, confirmPassword } = payload;

		AuthErrors.ensureDataRegister({ name, email, password, confirmPassword });
		await AuthErrors.ensureUserExistByEmail(prisma.user, email);

		const defaultRole = await prisma.role.findUnique({
			where: { role: "user" },
		});

		const createdUser = (await prisma.user.create({
			data: {
				name,
				email,
				password: await encryptPassword(password),
				roleId: defaultRole?.id!,
				profile: { create: {} },
			},
		})) as UserPayload;

		const token = await JwtToken.create(createdUser, reply);

		return {
			tokenType: process.env.TOKEN_TYPE!,
			token,
			expiresIn: process.env.TOKEN_EXPIRES!,
		};
	}

	static async login(email: string, password: string, reply: FastifyReply) {
		AuthErrors.ensureDataLogin(email, password);
		await AuthErrors.ensureUserNotExistByEmail(prisma.user, email);

		const user = (await prisma.user.findUnique({
			where: { email },
		})) as UserPayload;

		AuthErrors.ensureMatchPassword(
			await comparePassword(password, user.password),
		);

		const { password: _, ...userPayload } = user as UserPayload;

		const token = await JwtToken.create(userPayload, reply);

		return {
			tokenType: process.env.TOKEN_TYPE!,
			token,
			expiresIn: process.env.TOKEN_EXPIRES!,
		};
	}
}
