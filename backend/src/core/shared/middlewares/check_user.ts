import type { FastifyRequest } from 'fastify';
import { JwtToken } from '../utils/jwt/jwt_token.js';

import { TokenErrors } from '../utils/jwt/token.errors.js';

export async function checkUser(req: FastifyRequest) {
    if (!req.headers.authorization) TokenErrors.throwMissing();

    const user = await JwtToken.getByUser(req);
    if (!user) TokenErrors.throwAccessDenied();

    const { id } = req.params as { id: string };

    if (Number(id) !== user.id) {
        TokenErrors.throwUnauthorizedAction();
    }
}
