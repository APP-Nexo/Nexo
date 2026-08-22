import type { FastifyRequest } from 'fastify';
import { JwtToken } from '../utils/jwt/jwt_token.js';
import { TokenErrors } from '../utils/jwt/token.errors.js';
import prisma from '../utils/prisma/prisma_conn.js';

export async function checkToken(req: FastifyRequest) {
    if (!req.headers.authorization) TokenErrors.throwMissing();

    const tokenUser = await JwtToken.getByUser(req);
    const user = await prisma.user.findUnique({
        where: { id: tokenUser.id },
        select: {
            id: true,
            email: true,
            roleId: true,
            credentialVersion: true,
            activate: true,
            deletedAt: true,
            blockedUser: { select: { id: true } },
        },
    });

    if (
        !user?.activate ||
        user.deletedAt ||
        user.blockedUser ||
        tokenUser.sub !== String(user.id)
    ) {
        TokenErrors.throwAccessDenied();
    }

    const session = await prisma.authSession.findFirst({
        where: {
            id: tokenUser.sid,
            userId: user.id,
            revokedAt: null,
            expiresAt: { gt: new Date() },
            credentialVersion: user.credentialVersion,
        },
        select: { id: true, credentialVersion: true },
    });
    if (!session || session.credentialVersion !== user.credentialVersion) {
        TokenErrors.throwInvalid();
    }

    JwtToken.setCurrentUser(req, {
        ...tokenUser,
        id: user.id,
        sub: String(user.id),
        email: user.email,
        roleId: user.roleId,
        typ: 'access',
        sid: session.id,
    });
}
