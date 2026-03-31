import { BaseErrors } from "./base-errors.js"
import type { UserTokenPayload } from "../interfaces/I-Jwt.js";

export class UserErrors extends BaseErrors {
    static ensureDelete(email: string,  tokenUser: UserTokenPayload )
    {
        if(!email) throw new BaseErrors('Digite o email para deletar sua conta.', 401)
        if (email !== tokenUser.email) throw new BaseErrors('Email incorreto.', 401)
    }
}