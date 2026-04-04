import type { FastifyReply, FastifyRequest } from "fastify";
import { AdminService } from "./admin.service.js";

export class AdminController {
	// ==================================
	//  @get
	//  @return: { usersStatus: stats }
	//  @status:  200 OK
	// ==================================
	static async getUsersStats(req: FastifyRequest, reply: FastifyReply) {
		try {
			const response = await AdminService.getUsersStats();
			return reply.status(200).send(response);
		} catch (error) {
			throw error;
		}
	}

	// ============================
	//  @get
	//  @return: { users: users }
	//  @status:  200 OK
	// ============================
	static async getUsersAdmin(req: FastifyRequest, reply: FastifyReply) {
		try {
			const response = await AdminService.getUsersAdmin();
			return reply.status(200).send(response);
		} catch (error) {
			throw error;
		}
	}

	// ===========================================
	//  @get
	//  @return: { users: data, nextCursor }
	//  @status:  200 OK
	// ===========================================
	static async searchUser(req: FastifyRequest, reply: FastifyReply) {
		try {
			const { email, cursor } = req.query as {
				email?: string;
				cursor?: string;
			};
			const response = await AdminService.searchUser(email, cursor);
			return reply.status(200).send(response);
		} catch (error) {
			throw error;
		}
	}

	// =========================================
	//  @get
	//  @return: { users: data, nextCursor }
	//  @status:  200 OK
	// =========================================
	static async getUsers(req: FastifyRequest, reply: FastifyReply) {
		try {
			const { cursor, limit = 10 } = req.query as {
				cursor?: string;
				limit?: number;
			};
			const response = await AdminService.getUsers(cursor, Number(limit));
			return reply.status(200).send(response);
		} catch (error) {
			throw error;
		}
	}
}
