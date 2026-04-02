import type { FastifyRequest, FastifyReply } from 'fastify';

import type { UserTokenPayload } from '../helpers/interfaces/I-Jwt.js';

import { FollowErrors } from '../helpers/errors/follow-errors.js';

import prisma from '../helpers/utils/prisma_conn.js';

export class FollowController
{
    // =======================================================
    //  @post
    //  @return: { message: `Você começou a seguir ${following?.name}.` }
    //  @status:  201 OK
    // =======================================================
    static async followUser(req: FastifyRequest, reply: FastifyReply) 
    {
        try 
        {
            const { id } = req.params as { id: string }
            const tokenUser = req.user as UserTokenPayload

            const following = await prisma.vwUserPublic.findUnique({ where: { id: Number(id) }})
            await FollowErrors.ensureFollow(prisma.userFollow, tokenUser.id, Number(id), String(following?.name))
            
            await prisma.$executeRaw`SELECT follow_user(${tokenUser.id}::int, ${Number(id)}::int)`

            return reply.status(201).send({ message: `Você começou a seguir ${following?.name}.` })

        } catch(error) {
            throw error
        }
    }

    // =====================================================================
    //  @delete
    //  @return: { message: `Você deixou de seguir ${unfollowing?.name}.` }
    //  @status:  200 OK
    // =====================================================================
    static async unfollowUser(req: FastifyRequest, reply: FastifyReply) 
    {
        try 
        {
            const { id } = req.params as { id: string }
            const tokenUser = req.user as UserTokenPayload

            const unfollowing = await prisma.vwUserPublic.findUnique({ where: { id: Number(id) }})
            await FollowErrors.ensureUnfollow(prisma.userFollow, tokenUser.id, Number(id), String(unfollowing?.name))
            
            await prisma.userFollow.delete({
                where: {
                        followerId_followingId: {
                        followerId:  tokenUser.id,
                        followingId: Number(id),
                    }
                }
            })

            return reply.status(201).send({ message: `Você deixou de seguir ${unfollowing?.name}.` })
            
        } catch(error) {
            throw error
        }
    }
}