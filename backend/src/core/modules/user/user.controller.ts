import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ParamCursor, ParamId } from '../../shared/types/common.types.js';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import type { UserPayload } from '../auth/auth.interfaces.js';
import type { SearchUserQuery } from './user.interfaces.js';
import { UserService } from './user.service.js';

export class UserController {
    // ==============================================
    //  @get: /api/user/search
    //  @returns: { users: data, nextCursor, total }
    //  @status:  200 OK
    // ==============================================
    static async searchUser(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { find, cursor } = req.query as SearchUserQuery;
            const tokenUser = req.user as UserPayload;

            const response = await UserService.searchUser(tokenUser, find, cursor);
            return reply.status(200).send(response);
        } catch (error) {
            throw error;
        }
    }

    // ==============================================================================================
    //  @get: /api/user/:id
    //  @returns: user: { ...userData, isFollowing: !!isFollowing },
    //           profile: { friendlyId, photo, banner, bio, config, followersCount, followingCount }
    //  @status:  200 OK
    // ===============================================================================================
    static async getUser(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as ParamId;
            const tokenUser = req.user as UserPayload;

            const response = await UserService.getUser(tokenUser, Number(id));
            return reply.status(200).send(response);
        } catch (error) {
            throw error;
        }
    }

    // =======================================================================================================
    //  @patch: /api/user/delete
    //  @returns: { message: 'Conta deletada.', deletedAt: new Date().toISOString(), email: tokenUser.email }
    //  @status:  200 OK
    // ========================================================================================================
    static async delete(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { email } = req.body as { email: string };
            const tokenUser = req.user as UserTokenPayload;

            const response = await UserService.deleteUser(tokenUser, email);
            return reply.status(200).send(response);
        } catch (error) {
            throw error;
        }
    }

    // ===============================================================================
    //  @get: /api/user/followers
    //  @returns: { followers: [{ ...userData, isFollowing: boolean }], nextCursor }
    //  @status:  200 OK
    // ===============================================================================
    static async getFollowers(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { cursor } = req.query as ParamCursor;
            const tokenUser = req.user as UserPayload;

            const response = await UserService.getFollowers(tokenUser, cursor);
            return reply.send(response);
        } catch (error) {
            throw error;
        }
    }

    // ===============================================================================
    //  @get: /api/user/followings
    //  @returns: { followings: [{ ...userData, isFollowing: boolean }], nextCursor }
    //  @status:  200 OK
    // ===============================================================================
    static async getFollowings(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { cursor } = req.query as ParamCursor;
            const tokenUser = req.user as UserPayload;

            const response = await UserService.getFollowings(tokenUser, cursor);
            return reply.send(response);
        } catch (error) {
            throw error;
        }
    }
}
