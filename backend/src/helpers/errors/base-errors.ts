import { GenericQueries } from "../../repository/generics.js";
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

    static async ensureUserExist(query: GenericQueries<any>, id: number) 
    {
        const user = await query.findUnique({ id })
        if (!user) throw new BaseErrors('Usuário não existe.', 404)
        return user
    }

    static async ensureUserNotExist(query: GenericQueries<any>, email: string) 
    {
        const user = await query.findUnique({ email })
        if (user) throw new BaseErrors('Email indisponível.', 409)
    }
}