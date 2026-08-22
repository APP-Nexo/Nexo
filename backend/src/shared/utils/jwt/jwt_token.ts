import '@fastify/jwt';
import { randomUUID } from 'node:crypto';
import { createDecoder, createSigner, createVerifier } from 'fast-jwt';
import type { FastifyRequest } from 'fastify';
import { env } from '../../config/env.js';
import type { RefreshTokenPayload, TokenUser, UserTokenPayload } from './jwt.interfaces.js';
import { TokenErrors } from './token.errors.js';

export const JWT_ISSUER = env.jwtIssuer;
export const JWT_AUDIENCE = env.jwtAudience;

const verifyOptions = {
    allowedIss: JWT_ISSUER,
    allowedAud: JWT_AUDIENCE,
    requiredClaims: ['iss', 'aud', 'sub', 'typ', 'sid', 'jti'],
};

function durationMilliseconds(value: string) {
    const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
    if (!match) throw new Error(`Duração de token inválida: ${value}`);

    const amount = Number(match[1]);
    const multiplier = {
        ms: 1,
        s: 1_000,
        m: 60_000,
        h: 3_600_000,
        d: 86_400_000,
    }[match[2] as 'ms' | 's' | 'm' | 'h' | 'd'];
    return amount * multiplier;
}

const signAccess = createSigner({
    key: env.secret,
    expiresIn: durationMilliseconds(env.tokenExpires),
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
});
const signRefresh = createSigner({
    key: env.secret,
    expiresIn: durationMilliseconds(env.refreshTokenExpires),
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
});
const verifyRefresh = createVerifier({ key: env.secret, ...verifyOptions });
const decodeToken = createDecoder();
const currentUsers = new WeakMap<FastifyRequest, UserTokenPayload>();

export class JwtToken {
    static async create(user: TokenUser, sessionId: string) {
        try {
            return signAccess({
                id: user.id,
                email: user.email,
                roleId: user.roleId,
                typ: 'access',
                sid: sessionId,
                sub: String(user.id),
                jti: randomUUID(),
            }) as string;
        } catch {
            return TokenErrors.throwCreationFailed();
        }
    }

    static async createRefresh(user: Pick<TokenUser, 'id'>, sessionId: string) {
        try {
            return signRefresh({
                id: user.id,
                typ: 'refresh',
                sid: sessionId,
                sub: String(user.id),
                jti: randomUUID(),
            }) as string;
        } catch {
            return TokenErrors.throwCreationFailed();
        }
    }

    static verifyRefresh(token: string) {
        try {
            const payload = verifyRefresh(token) as RefreshTokenPayload;
            if (
                payload.typ !== 'refresh' ||
                typeof payload.sid !== 'string' ||
                !payload.sid ||
                typeof payload.jti !== 'string' ||
                !payload.jti ||
                !Number.isInteger(payload.id) ||
                payload.sub !== String(payload.id)
            ) {
                return TokenErrors.throwInvalid();
            }
            return payload;
        } catch {
            return TokenErrors.throwInvalid();
        }
    }

    static getExpiration(token: string) {
        const payload = decodeToken(token) as { exp?: number } | null;
        if (!payload || !Number.isFinite(payload.exp)) return TokenErrors.throwCreationFailed();
        return new Date(payload.exp! * 1000);
    }

    static async getByUser(req: FastifyRequest) {
        const currentUser = currentUsers.get(req);
        if (currentUser) return currentUser;

        try {
            const user = await req.jwtVerify<UserTokenPayload>(verifyOptions);
            if (
                user.typ !== 'access' ||
                typeof user.sid !== 'string' ||
                !user.sid ||
                typeof user.jti !== 'string' ||
                !user.jti ||
                !Number.isInteger(user.id) ||
                user.sub !== String(user.id)
            ) {
                return TokenErrors.throwInvalid();
            }
            return user;
        } catch {
            return TokenErrors.throwInvalid();
        }
    }

    static setCurrentUser(req: FastifyRequest, user: UserTokenPayload) {
        req.user = user;
        currentUsers.set(req, user);
    }
}
