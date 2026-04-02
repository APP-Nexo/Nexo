import type { FastifyRequest, FastifyReply } from 'fastify';

import type { UserTokenPayload } from '../helpers/interfaces/I-Jwt.js';

import { FollowErrors } from '../helpers/errors/follow-errors.js';

import prisma from '../helpers/utils/prisma_conn.js';

export class FollowController
{
    // =======================================================
    //  @post
    //  @return: { message: 'Usuário seguido com sucesso.' }
    //  @status:  201 OK
    // =======================================================
    static async followUser(req: FastifyRequest, reply: FastifyReply) 
    {
        try 
        {
            const { id } = req.params as { id: string }
            const tokenUser = req.user as UserTokenPayload

            await FollowErrors.ensureFollow(prisma.userFollow, tokenUser.id, Number(id))
            
            await prisma.userFollow.create({
                data: {
                    followerId:  tokenUser.id,
                    followingId: Number(id),
                }
            })

            return reply.status(201).send({ message: 'Usuário seguido com sucesso.' })

        } catch(error) {
            throw error
        }
    }

    // ============================================================
    //  @delete
    //  @return: { message: 'Você deixou de seguir um usuário.' }
    //  @status:  200 OK
    // ============================================================
    static async unfollowUser(req: FastifyRequest, reply: FastifyReply) 
    {
        try 
        {
            const { id } = req.params as { id: string }
            const tokenUser = req.user as UserTokenPayload

            await FollowErrors.ensureUnfollow(prisma.userFollow, tokenUser.id, Number(id))
            
            await prisma.userFollow.delete({
                where: {
                        followerId_followingId: {
                        followerId:  tokenUser.id,
                        followingId: Number(id),
                    }
                }
            })

            return reply.status(200).send({ message: 'Você deixou de seguir um usuário.' })
            
        } catch(error) {
            throw error
        }
    }
}