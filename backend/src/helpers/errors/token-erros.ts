export class TokenErrors extends Error {
    public statusCode: number;

    public constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'Token Errors';
        this.statusCode = statusCode;
    }

    static throwMissing(): never {
        throw new TokenErrors('Token não informado.', 401)
    }

    static throwInvalid(): never {
        throw new TokenErrors('Token inválido ou expirado.', 401)
    }

    static throwCreationFailed(): never {
        throw new TokenErrors('Falha ao criar token.', 500)
    }

    static throwAccessDenied(): never {
        throw new TokenErrors('Acesso negado!', 401)
    }

    static throwNoAccess(): never {
        throw new TokenErrors('Sem token de acesso!', 401)
    }

    static throwUnauthorizedAction(): never {
        throw new TokenErrors('Você não tem permissão para realizar esta ação.', 403)
    }
}