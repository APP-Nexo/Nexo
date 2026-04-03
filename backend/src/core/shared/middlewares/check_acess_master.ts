import type { FastifyRequest } from 'fastify'
import { JwtToken } from '../utils/jwt/jwt_token.js'
import { TokenErrors } from '../utils/jwt/token.errors.js'
import { GenericQueries } from '../repository/generics.js'
import type { Role } from '../../generated/client.js'
import prisma from '../utils/prisma/prisma_conn.js'

const roleQuery = new GenericQueries<Role>(prisma.role)

export async function checkAccessMaster(req: FastifyRequest) {
    if (!req.headers.authorization) TokenErrors.throwMissing()
    
    const user = await JwtToken.getByUser(req)
    if (!user) TokenErrors.throwAccessDenied()

    const role = await roleQuery.findUnique({ id: user.roleId })

    if (role?.role !== 'master') {
        TokenErrors.throwUnauthorizedAction()
    }
}