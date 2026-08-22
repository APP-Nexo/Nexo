import type { FastifyRequest } from 'fastify';
import type { UserTokenPayload } from '../utils/jwt/jwt.interfaces.js';
import { TokenErrors } from '../utils/jwt/token.errors.js';
import prisma from '../utils/prisma/prisma_conn.js';
import { checkToken } from './check_token.js';

export async function checkAccessPerm(req: FastifyRequest) {
    if (!req.headers.authorization) TokenErrors.throwMissing();

    if (!req.user) await checkToken(req);

    const tokenUser = req.user as UserTokenPayload | undefined;
    if (!tokenUser || !Number.isInteger(tokenUser.id)) TokenErrors.throwAccessDenied();

    const user = await prisma.user.findUnique({
        where: { id: tokenUser.id },
        select: {
            activate: true,
            deletedAt: true,
            blockedUser: { select: { id: true } },
            role: { select: { role: true } },
        },
    });

    if (
        !user?.activate ||
        user.deletedAt ||
        user.blockedUser ||
        (user.role.role !== 'master' && user.role.role !== 'admin')
    ) {
        TokenErrors.throwUnauthorizedAction();
    }
}
