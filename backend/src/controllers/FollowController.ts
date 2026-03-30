import type { FastifyRequest, FastifyReply } from 'fastify';

import prisma from '../helpers/utils/prisma_conn.js';

export class FollowController
{
    static async followUser(req: FastifyRequest, reply: FastifyReply) 
    {
        // return await prisma.userFollow.create({
        //     data: { followerId, followingId }
        // });
    }

    static async unfollowUser(req: FastifyRequest, reply: FastifyReply) 
    {
        // return await prisma.userFollow.delete({
        //     where: {
        //     followerId_followingId: { followerId, followingId }
        //     }
        // });
    }
}