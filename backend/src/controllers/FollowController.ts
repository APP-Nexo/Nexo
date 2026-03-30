import type { FastifyRequest, FastifyReply } from 'fastify';

import type { UserTokenPayload } from '../helpers/interfaces/I-Jwt.js';
import type { UserFollow } from '../generated/client.js';

import { GenericQueries } from '../repository/generics.js';
import prisma from '../helpers/utils/prisma_conn.js';
const userFollowQuery = new GenericQueries<UserFollow>(prisma.userFollow)

export class FollowController
{
    static async followUser(req: FastifyRequest, reply: FastifyReply) 
    {
        const { followingId } = req.params as { followingId: string }
        const tokenUser = req.user as UserTokenPayload
        
        //const tokenUser = req.user as any
        
        // return await prisma.userFollow.create({
        //     data: { followerId, followingId }
        // });
    }

    static async unfollowUser(req: FastifyRequest, reply: FastifyReply) 
    {
        const { followingId } = req.params as { followingId: string }
        const tokenUser = req.user as UserTokenPayload
        
       // const tokenUser = req.user
        // return await prisma.userFollow.delete({
        //     where: {
        //     followerId_followingId: { followerId, followingId }
        //     }
        // });
    }
}