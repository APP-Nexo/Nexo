import { AppError } from '../../shared/errors/app-error.js';
import {
    isValidUsername,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from '../../shared/utils/auth/auth_values.js';
import type { RegisterPayload } from './auth.interfaces.js';

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export class AuthErrors extends AppError {
    constructor(message: string, statusCode: number) {
        super(message, statusCode, 'Auth Errors');
    }

    static throw(message: string, statusCode: number): never {
        throw new AuthErrors(message, statusCode);
    }

    static throwMissing(field: string) {
        throw new AuthErrors(`O campo ${field} é obrigatório e não foi fornecido.`, 400);
    }

    static throwPasswordMismatch() {
        throw new AuthErrors('As senhas não coincidem.', 400);
    }

    static ensureDataRegister({ username, email, password, confirmPassword }: RegisterPayload) {
        if (!username) AuthErrors.throwMissing('username');
        if (!email) AuthErrors.throwMissing('email');
        if (!password) AuthErrors.throwMissing('password');
        if (!confirmPassword) AuthErrors.throwMissing('confirm password');
        if (!isValidUsername(username)) {
            AuthErrors.throw(
                `O username deve ter entre ${USERNAME_MIN_LENGTH} e ${USERNAME_MAX_LENGTH} caracteres e usar apenas letras, números, ponto, hífen ou underscore.`,
                400,
            );
        }
        AuthErrors.ensureEmail(email);
        AuthErrors.ensurePassword(password);
        if (password !== confirmPassword) AuthErrors.throwPasswordMismatch();
    }

    static ensureDataLogin(identifier: string, password: string) {
        if (!identifier) AuthErrors.throwMissing('identifier');
        if (!password) AuthErrors.throwMissing('password');
        AuthErrors.ensurePassword(password);
    }

    static ensureMatchPassword(match: boolean) {
        if (!match) AuthErrors.throwInvalidCredentials();
    }

    static ensureEmail(email: string) {
        if (!email) AuthErrors.throwMissing('email');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new AuthErrors('Email inválido.', 400);
        }
    }

    static ensurePassword(password: string) {
        if (!password) AuthErrors.throwMissing('password');
        if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
            throw new AuthErrors(
                `A senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`,
                400,
            );
        }
    }

    static throwInvalidCredentials(): never {
        throw new AuthErrors('Credenciais inválidas.', 401);
    }

    static throwAccountUnavailable(): never {
        throw new AuthErrors('Conta inativa ou bloqueada.', 403);
    }

    static ensureRefreshToken(token: string | undefined) {
        if (!token) throw new AuthErrors('Refresh token não encontrado.', 401);
    }
}
