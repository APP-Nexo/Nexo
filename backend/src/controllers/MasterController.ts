import type { FastifyRequest, FastifyReply } from 'fastify';

import { AdminErrors } from '../helpers/errors/admin-errors.js';

import type { VwUserPublic, VwUsersStatusSummary, Role } from '../generated/client.js';

import { GenericQueries } from '../repository/generics.js';
import prisma from '../helpers/utils/prisma_conn.js';
const vwUserQuery = new GenericQueries<VwUserPublic>(prisma.vwUserPublic)
const roleQuery = new GenericQueries<Role>(prisma.role)
const userQuery = new GenericQueries(prisma.user)

export class MasterController 
{
    // ===========================================================================================
    //  @patch
    //  @returns: { message: 'Usuário promovido para admin.', email: user?.email, role: 'admin' }
    //  @status:  200 
    // ===========================================================================================
    static async promoteUser(req: FastifyRequest, reply: FastifyReply) 
    {
        const { id } = req.params as { id: string }

        await AdminErrors.ensureNotMaster(Number(id))
        await AdminErrors.ensureUserExistById(vwUserQuery, Number(id))

        const adminRole = await roleQuery.findUnique({ role: 'admin' })
        if (!adminRole) return

        await AdminErrors.ensureRole(Number(id), adminRole.id, 'Usuário ja é admin.')
        await userQuery.update(Number(id), { roleId: adminRole.id })

        const user = await vwUserQuery.findUnique({ id: Number(id) })

        return reply.status(200).send({ message: 'Usuário promovido para admin.', email: user?.email, role: 'admin' })
    }

    // =========================================================================================
    //  @patch
    //  @returns: { message: 'Usuário rebaixado para user.', email: user?.email, role: 'user' }
    //  @status:  200 OK
    // =========================================================================================
    static async demoteUser(req: FastifyRequest, reply: FastifyReply) 
    {
        const { id } = req.params as { id: string }
        await AdminErrors.ensureNotMaster(Number(id))
        await AdminErrors.ensureUserExistById(vwUserQuery, Number(id))

        const userRole = await roleQuery.findUnique({ role: 'user' })
        if (!userRole) return

        await AdminErrors.ensureRole(Number(id), userRole.id, 'Usuário ja é user.')

        await userQuery.update(Number(id), { roleId: userRole.id })

        const user = await vwUserQuery.findUnique({ id: Number(id) })

        return reply.status(200).send({ message: 'Usuário rebaixado para user.', email: user?.email, role: 'user' })
    }

    // ==================================================================================================
    //  @patch
    //  @returns: { message: 'Usuário banido.', email: user?.email, bannedAt: new Date().toISOString() }
    //  @status:  200 OK
    // ==================================================================================================
    static async banUser(req: FastifyRequest, reply: FastifyReply) 
    {
        const { id } = req.params as { id: string }
        await AdminErrors.ensureNotMaster(Number(id))
        await AdminErrors.ensureUserExistById(vwUserQuery, Number(id))

        const user = await prisma.user.findUnique({ where: { id: Number(id) } })

        await userQuery.update(Number(id), {
            activate: false,
            email: `banned_${id}_${user?.email}`,
            deletedAt: new Date()
        })

        return reply.status(200).send({ message: 'Usuário banido.', email: user?.email, bannedAt: new Date().toISOString() })
    }
}