
import type { FastifyRequest } from 'fastify'
import { JwtToken } from '../helpers/utils/jwt_token.js'

import { TokenErrors } from '../helpers/errors/token-erros.js'

export async function checkToken(req: FastifyRequest) {
    if (!req.headers.authorization) TokenErrors.throwMissing()
    
    await JwtToken.get(req)
}