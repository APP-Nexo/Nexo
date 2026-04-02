import { BaseErrors } from "./base-errors.js";

export class FollowErrors extends BaseErrors 
{
    static async ensureFollow(query: any, followerId: number, followingId: number)
    {
        if (followerId === followingId) throw new BaseErrors('Você não pode seguir a si mesmo.', 400)

        const exists = await query.findFirst({ where: { followerId, followingId }})

        if (exists) throw new BaseErrors('Você já segue este usuário.', 409)
    }


    static async ensureUnfollow(query: any, followerId: number, followingId: number)
    {
        if (followerId === followingId) throw new BaseErrors('Você não pode desseguir a si mesmo.', 400)

        const exists = await query.findFirst({ where: { followerId, followingId } })

        if (!exists) throw new BaseErrors('Você não segue este usuário.', 404)
    }
}