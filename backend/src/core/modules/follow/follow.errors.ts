export class FollowErrors extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'FollowErrors';
        this.statusCode = statusCode;
    }

    private static throw(message: string, statusCode: number): never {
        throw new FollowErrors(message, statusCode)
    }

    static async ensureFollow(table: any, followerId: number, followingId: number, followingName: string) {
        if (followerId === followingId) this.throw('Você não pode seguir a si mesmo.', 400)

        const exists = await table.findFirst({ where: { followerId, followingId } })
        if (exists) this.throw(`Você já segue ${followingName}.`, 409)
    }

    static async ensureUnfollow(table: any, followerId: number, followingId: number, followingName: string) {
        if (followerId === followingId) this.throw('Você não pode desseguir a si mesmo.', 400)

        const exists = await table.findFirst({ where: { followerId, followingId } })
        if (!exists) this.throw(`Você não segue ${followingName}.`, 404)
    }
}