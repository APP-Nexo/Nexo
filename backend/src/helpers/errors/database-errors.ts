export class DatabaseErrors extends Error {
    public statusCode: number;

    public constructor(message: string, statusCode: number) 
    {
        super(message);
        this.name = 'Database Errors';
        this.statusCode = statusCode;
    }

    static throwNotFound(resource: string): never
    {
    throw new DatabaseErrors(`${resource} não encontrado.`, 404)
    }

    static throwAlreadyExists(resource: string): never 
    {
    throw new DatabaseErrors(`${resource} já existe.`, 409)
    }

    static throwQueryFailed(): never
    {
    throw new DatabaseErrors('Erro ao executar operação no banco.', 500)
    }
}