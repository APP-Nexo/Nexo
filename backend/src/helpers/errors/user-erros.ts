import { BaseErrors } from "./base-errors.js"
import type { UserTokenPayload } from "../interfaces/I-Jwt.js";

import { GenericQueries } from "../../repository/generics.js";

export class UserErrors extends BaseErrors {
    static ensureDelete(email: string,  tokenUser: UserTokenPayload )
    {
        if(!email) throw new BaseErrors('Digite o email para deletar sua conta.', 401)
        if (email !== tokenUser.email) throw new BaseErrors('Email incorreto.', 401)
    }

    static async ensureUserActive(query: GenericQueries<any>, id: number) {
        const user = await query.findUnique({ id }) 
        if (!user.activate) throw new BaseErrors('Esta conta ja está desativada.', 403)
    }
}