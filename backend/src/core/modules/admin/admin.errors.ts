export class AdminErrors extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'Admin Errors';
        this.statusCode = statusCode;
    }
}
