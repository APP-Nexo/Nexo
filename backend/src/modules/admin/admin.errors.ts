import { AppError } from '../../shared/errors/app-error.js';

export class AdminErrors extends AppError {
    constructor(message: string, statusCode: number) {
        super(message, statusCode, 'Admin Errors');
    }
}
