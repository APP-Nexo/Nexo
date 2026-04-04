import type { FindByEmail, RegisterPayload } from './auth.interfaces.js';

export class AuthErrors extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'Auth Errors';
        this.statusCode = statusCode;
    }

    static throwMissing(field: string) {
        throw new AuthErrors(`O campo ${field} é obrigatório e não foi fornecido.`, 400);
    }

    static throwPasswordMismatch() {
        throw new AuthErrors('As senhas não coincidem.', 400);
    }

    static ensureDataRegister({ name, email, password, confirmPassword }: RegisterPayload) {
        if (!name) AuthErrors.throwMissing('name');
        if (!email) AuthErrors.throwMissing('email');
        if (!password) AuthErrors.throwMissing('password');
        if (!confirmPassword) AuthErrors.throwMissing('confirm password');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AuthErrors('Email inválido.', 400);
        if (password.length < 5)
            throw new AuthErrors('A senha deve ter no mínimo 5 caracteres.', 400);
        if (password != confirmPassword) AuthErrors.throwPasswordMismatch();
    }

    static ensureDataLogin(email: string, password: string) {
        if (!email) AuthErrors.throwMissing('email');
        if (!password) AuthErrors.throwMissing('password');
    }

    static ensureMatchPassword(match: boolean) {
        if (!match) throw new AuthErrors('Senha incorreta.', 403);
    }

    static async ensureUserExistByEmail(table: FindByEmail, email: string) {
        const user = await table.findUnique({ where: { email } });
        if (user) throw new AuthErrors('Email indisponível.', 409);
    }

    static async ensureUserNotExistByEmail(table: FindByEmail, email: string) {
        const user = await table.findUnique({ where: { email } });
        if (!user) throw new AuthErrors('Email não cadastrado.', 409);
    }
}
