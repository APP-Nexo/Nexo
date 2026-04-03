import type { FastifyRequest } from 'fastify'
import { JwtToken } from '../utils/jwt/jwt_token.js'
import { TokenErrors } from '../utils/jwt/token.errors.js'
import type { Role } from '../../generated/client.js'
import prisma from '../utils/prisma/prisma_conn.js'

export async function checkAccessMaster(req: FastifyRequest) {
    if (!req.headers.authorization) TokenErrors.throwMissing()
    
    const user = await JwtToken.getByUser(req)
    if (!user) TokenErrors.throwAccessDenied()

    const role = await prisma.role.findUnique({ where: { id: user.roleId } })

    if (role?.role !== 'master') {
        TokenErrors.throwUnauthorizedAction()
    }
}