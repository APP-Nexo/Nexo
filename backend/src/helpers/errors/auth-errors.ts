import { BaseErrors } from "./base-errors.js";

import type { RegisterPayload } from "../interfaces/I-Auth.js";

import { GenericQueries } from "../../repository/generics.js";

export class AuthErrors extends BaseErrors {
    static ensureRegister({ name, email, password, confirmPassword }: RegisterPayload) 
    {
        if (!name) this.throwMissing('name')
        if (!email) this.throwMissing('email')
        if (!password) this.throwMissing('password')
        if (!confirmPassword) this.throwMissing('confirmPassword')
        
        if (password.length < 5) throw new BaseErrors('A senha deve ter no mínimo 5 caracteres.', 400)
        if(password != confirmPassword) this.throwPasswordMismatch()
    }

    static async ensureUserNotExists(query: GenericQueries<any>, email: string) {
        const user = await query.findUnique({ email })
        if (user) throw new BaseErrors('Este email já está em uso.', 409)
    }
}