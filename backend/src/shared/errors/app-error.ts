export class AppError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number, name = 'AppError') {
        super(message);
        this.name = name;
        this.statusCode = statusCode;
    }

    static throw(message: string, statusCode: number): never {
        throw new AppError(message, statusCode);
    }
}
