import { AppError } from '../../shared/errors/app-error.js';

export class NotificationErrors extends AppError {
    constructor(message: string, statusCode: number) {
        super(message, statusCode, 'Notification Errors');
    }

    static throw(message: string, statusCode: number): never {
        throw new NotificationErrors(message, statusCode);
    }
}
