import type { FastifyRequest } from 'fastify'
import { JwtToken } from '../helpers/utils/jwt_token.js'
import { TokenErrors } from '../helpers/errors/token-erros.js'
import { GenericQueries } from '../repository/generics.js'
import type { Role } from '../generated/client.js'
import prisma from '../helpers/utils/prisma_conn.js'

const roleQuery = new GenericQueries<Role>(prisma.role)

export async function checkAccessPerm(req: FastifyRequest) {
    if (!req.headers.authorization) TokenErrors.throwMissing()
    
    const user = await JwtToken.getByUser(req)
    if (!user) TokenErrors.throwAccessDenied()

    const role = await roleQuery.findUnique({ id: user.roleId })

    if (role?.role !== 'master' && role?.role !== 'admin') {
        TokenErrors.throwUnauthorizedAction()
    }
}