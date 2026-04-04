export class MasterErrors extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'Master Errors';
        this.statusCode = statusCode;
    }

    private static throw(message: string, statusCode: number): never {
        throw new MasterErrors(message, statusCode);
    }

    static async ensureNotMaster(table: any, id: number) {
        const user = await table.findUnique({
            where: { id },
            include: { role: true },
        });

        if (user?.role?.role === 'master') {
            MasterErrors.throw('O usuário master não pode sofrer ações severas na conta.', 403);
        }
    }

    static async ensureRole(table: any, userId: number, roleId: number, message: string) {
        const user = await table.findUnique({ where: { id: userId } });

        if (user?.roleId === roleId) {
            MasterErrors.throw(message, 400);
        }
    }

    static async ensureUserExistById(table: any, id: number) {
        const user = await table.findUnique({ where: { id } });
        if (!user) MasterErrors.throw('Usuário não existe.', 404);
        return user;
    }
}
