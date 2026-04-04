import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserTokenPayload } from "../../shared/utils/jwt/jwt.interfaces.js";
import { FollowService } from "./follow.service.js";

export class FollowController {
	// =======================================================
	//  @post
	//  @return: { message: `Você começou a seguir ${following?.name}.` }
	//  @status:  201 OK
	// =======================================================
	static async followUser(req: FastifyRequest, reply: FastifyReply) {
		try {
			const { id } = req.params as { id: string };
			const tokenUser = req.user as UserTokenPayload;

			const response = await FollowService.followUser(tokenUser.id, Number(id));
			return reply.status(201).send(response);
		} catch (error) {
			throw error;
		}
	}

	// =====================================================================
	//  @delete
	//  @return: { message: `Você deixou de seguir ${unfollowing?.name}.` }
	//  @status:  200 OK
	// =====================================================================
	static async unfollowUser(req: FastifyRequest, reply: FastifyReply) {
		try {
			const { id } = req.params as { id: string };
			const tokenUser = req.user as UserTokenPayload;

			const response = await FollowService.unfollowUser(
				tokenUser.id,
				Number(id),
			);
			return reply.status(200).send(response);
		} catch (error) {
			throw error;
		}
	}
}
