import type { FastifyRequest } from 'fastify'
import { JwtToken } from '../helpers/utils/jwt_token.js'
import { TokenErrors } from '../helpers/errors/token-erros.js'

export async function checkAcess(req: FastifyRequest) 
{
    if (!req.headers.authorization) TokenErrors.throwMissing()
    
    const user = await JwtToken.getByUser(req)
    if (!user) TokenErrors.throwAccessDenied()

    if (user.roleId !== 2) {
        TokenErrors.throwUnauthorizedAction()
    }
}