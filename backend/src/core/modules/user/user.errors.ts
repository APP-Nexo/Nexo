import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

export class UserErrors extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'User Errors';
        this.statusCode = statusCode;
    }

    private static throw(message: string, statusCode: number): never {
        throw new UserErrors(message, statusCode);
    }

    static ensureDelete(email: string, tokenUser: UserTokenPayload) {
        if (!email) UserErrors.throw('Digite o email para deletar sua conta.', 401);
        if (email !== tokenUser.email) UserErrors.throw('Email incorreto.', 401);
    }

    static async ensureUserExistById(table: any, id: number) {
        const user = await table.findUnique({ where: { id } });
        if (!user) UserErrors.throw('Usuário não existe.', 404);
        return user;
    }

    static async ensureNotMaster(id: number) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });

        if (user?.role?.role === 'master') {
            UserErrors.throw('O usuário master não pode sofrer ações severas na conta.', 403);
        }
    }
}
