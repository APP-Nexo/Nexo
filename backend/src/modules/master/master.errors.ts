import { AppError } from '../../shared/errors/app-error.js';

export class MasterErrors extends AppError {
    constructor(message: string, statusCode: number) {
        super(message, statusCode, 'Master Errors');
    }

    static throw(message: string, statusCode: number): never {
        throw new MasterErrors(message, statusCode);
    }
}
