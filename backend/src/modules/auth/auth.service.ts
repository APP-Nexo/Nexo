import crypto from 'crypto';
import { app } from '../../conf.js';
import { comparePassword } from '../../shared/utils/argon2/compare_password.js';
import { encryptPassword } from '../../shared/utils/argon2/encrypt_password.js';
import { sendPasswordResetEmail } from '../../shared/utils/email/mailer.js';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import { JwtToken } from '../../shared/utils/jwt/jwt_token.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';
import { AuthErrors } from './auth.errors.js';
import type { RegisterPayload, UserPayload } from './auth.interfaces.js';

export class AuthService {
    static async register(payload: RegisterPayload) {
        const { username, email, password, confirmPassword } = payload;

        AuthErrors.ensureDataRegister({ username, email, password, confirmPassword });
        await AuthErrors.ensureUserExistByEmail(prisma.user, email);
        if (username) {
            await AuthErrors.ensureUsernameNotTaken(prisma.user, username);
        }

        const defaultRole = await prisma.role.findUnique({
            where: { role: 'user' },
        });

        const createdUser = (await prisma.user.create({
            data: {
                username: username ?? null,
                email,
                password: await encryptPassword(password),
                roleId: defaultRole?.id!,
                profile: { create: {} },
            },
        })) as UserPayload;

        const token = await JwtToken.create(createdUser);
        const refreshToken = await JwtToken.createRefresh(createdUser);

        return {
            tokenType: process.env.TOKEN_TYPE!,
            token,
            refreshToken,
            expiresIn: process.env.TOKEN_EXPIRES!,
        };
    }

    static async login(email: string, password: string) {
        AuthErrors.ensureDataLogin(email, password);
        await AuthErrors.ensureUserNotExistByEmail(prisma.user, email);

        const user = (await prisma.user.findUnique({
            where: { email },
        })) as UserPayload;

        AuthErrors.ensureMatchPassword(await comparePassword(password, user.password));

        const { password: _, ...userPayload } = user;

        const token = await JwtToken.create(userPayload);
        const refreshToken = await JwtToken.createRefresh(userPayload);

        return {
            tokenType: process.env.TOKEN_TYPE!,
            token,
            refreshToken,
            expiresIn: process.env.TOKEN_EXPIRES!,
        };
    }

    static async refresh(incomingRefreshToken: string) {
        AuthErrors.ensureRefreshToken(incomingRefreshToken);

        const payload = app.jwt.verify(incomingRefreshToken) as UserTokenPayload;
        const refreshToken = await JwtToken.createRefresh(payload);

        return {
            tokenType: process.env.TOKEN_TYPE!,
            refreshToken: refreshToken!,
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES!,
        };
    }

    static async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return;

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000);

        await prisma.passwordReset.create({
            data: { email, token, expiresAt },
        });

        const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
        if (smtpConfigured) {
            await sendPasswordResetEmail(email, token).catch(() => {});
        }

        return { token, expiresAt };
    }

    static async resetPassword(token: string, newPassword: string) {
        const reset = await prisma.passwordReset.findUnique({ where: { token } });

        if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
            throw AuthErrors.throw('Token inválido ou expirado.', 400);
        }

        const hashed = await encryptPassword(newPassword);

        await prisma.$transaction([
            prisma.user.update({
                where: { email: reset.email },
                data: { password: hashed },
            }),
            prisma.passwordReset.update({
                where: { id: reset.id },
                data: { usedAt: new Date() },
            }),
        ]);
    }
}
