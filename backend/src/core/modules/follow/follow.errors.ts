export class FollowErrors extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'Follow Errors';
        this.statusCode = statusCode;
    }

    private static throw(message: string, statusCode: number): never {
        throw new FollowErrors(message, statusCode);
    }

    static async ensureUserExistById(table: any, id: number) {
        const user = await table.findUnique({ where: { id } });
        if (!user) FollowErrors.throw('Usuário não existe.', 404);
        return user;
    }

    static async ensureFollow(
        table: any,
        followerId: number,
        followingId: number,
        followingName: string,
    ) {
        if (followerId === followingId) FollowErrors.throw('Você não pode seguir a si mesmo.', 400);

        const exists = await table.findFirst({
            where: { followerId, followingId },
        });
        if (exists) FollowErrors.throw(`Você já segue ${followingName}.`, 409);
    }

    static async ensureUnfollow(
        table: any,
        followerId: number,
        followingId: number,
        followingName: string,
    ) {
        if (followerId === followingId)
            FollowErrors.throw('Você não pode desseguir a si mesmo.', 400);

        const exists = await table.findFirst({
            where: { followerId, followingId },
        });
        if (!exists) FollowErrors.throw(`Você não segue ${followingName}.`, 404);
    }
}
