export class BaseErrors extends Error 
{
    public statusCode: number;

    public constructor(message: string, statusCode: number) 
    {
        super(message);
        this.name = 'Errors';
        this.statusCode = statusCode;
    }
    
    static throwMissing(field: string)
    {
        throw new BaseErrors(`O campo ${field} é obrigatório e não foi fornecido.`, 400);
    }

    static throwPasswordMismatch() {
        throw new BaseErrors('As senhas não coincidem.', 400)
    }
}