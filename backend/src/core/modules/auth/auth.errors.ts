import { BaseErrors } from "../../shared/errors/base-errors.js";

import type { RegisterPayload } from "./auth.interfaces.js";

export class AuthErrors extends BaseErrors {
    static ensureRegister({ name, email, password, confirmPassword }: RegisterPayload) 
    {
        if (!name) this.throwMissing('name')
        if (!email) this.throwMissing('email')
        if (!password) this.throwMissing('password')
        if (!confirmPassword) this.throwMissing('confirmPassword')
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BaseErrors('Email inválido.', 400)
        if (password.length < 5) throw new BaseErrors('A senha deve ter no mínimo 5 caracteres.', 400)
        if (password != confirmPassword) this.throwPasswordMismatch()
    }

    static ensureLogin(email: string, password: string)
    {
        if (!email) this.throwMissing('email')
        if (!password) this.throwMissing('password')
    }

    static ensureMatchPassword(match: boolean) 
    {
        if (!match) throw new BaseErrors('Senha incorreta.', 403)
    }
}