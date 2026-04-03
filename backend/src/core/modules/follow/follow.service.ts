import { FollowErrors } from './follow.errors.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

export class FollowService {
    static async followUser(followerId: number, followingId: number) 
    {
        const following = await prisma.vwUserPublic.findUnique({ where: { id: followingId } })

        await FollowErrors.ensureFollow(prisma.userFollow, followerId, followingId, String(following?.name))

        await prisma.$executeRaw`SELECT follow_user(${followerId}::int, ${followingId}::int)`

        return { message: `Você começou a seguir ${following?.name}.` }
    }

    static async unfollowUser(followerId: number, followingId: number) 
    {
        const unfollowing = await prisma.vwUserPublic.findUnique({ where: { id: followingId } })

        await FollowErrors.ensureUnfollow(prisma.userFollow, followerId, followingId, String(unfollowing?.name))

        await prisma.userFollow.delete({
        where: {
            followerId_followingId: { followerId, followingId }
        }
        })

        return { message: `Você deixou de seguir ${unfollowing?.name}.` }
    }
}