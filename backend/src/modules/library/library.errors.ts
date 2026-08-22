import { AppError } from '../../shared/errors/app-error.js';

export class LibraryError extends AppError {
    constructor(message: string, statusCode: number) {
        super(message, statusCode, 'LibraryError');
    }

    static throw(message: string, statusCode: number): never {
        throw new LibraryError(message, statusCode);
    }

    static invalid(field: string): never {
        return LibraryError.throw(`Campo ${field} inválido.`, 400);
    }

    static gameNotFound(): never {
        return LibraryError.throw('Jogo não encontrado.', 404);
    }

    static ownedGameNotFound(): never {
        return LibraryError.throw('Jogo não encontrado na biblioteca.', 404);
    }

    static listNotFound(): never {
        return LibraryError.throw('Lista não encontrada.', 404);
    }

    static duplicateListName(): never {
        return LibraryError.throw('Já existe uma lista com este nome.', 409);
    }
}
