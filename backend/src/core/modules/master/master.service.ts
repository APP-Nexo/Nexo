import type { VwUserPublic, Role } from '../../generated/client.js';
import { AdminErrors } from '../admin/admin.errors.js';
import { GenericQueries } from '../../shared/repository/generics.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

const vwUserQuery = new GenericQueries<VwUserPublic>(prisma.vwUserPublic);
const roleQuery = new GenericQueries<Role>(prisma.role);
const userQuery = new GenericQueries(prisma.user);

export class MasterService {
    static async promoteUser(id: number) 
    {
        await AdminErrors.ensureNotMaster(id);
        await AdminErrors.ensureUserExistById(vwUserQuery, id);

        const adminRole = await roleQuery.findUnique({ role: 'admin' });
        if (!adminRole) return;

        await AdminErrors.ensureRole(id, adminRole.id, 'Usuário ja é admin.');
        await userQuery.update(id, { roleId: adminRole.id });

        const user = await vwUserQuery.findUnique({ id });
        return { message: 'Usuário promovido para admin.', email: user?.email, role: 'admin' };
    }

    static async demoteUser(id: number) 
    {
        await AdminErrors.ensureNotMaster(id);
        await AdminErrors.ensureUserExistById(vwUserQuery, id);

        const userRole = await roleQuery.findUnique({ role: 'user' });
        if (!userRole) return;

        await AdminErrors.ensureRole(id, userRole.id, 'Usuário ja é user.');
        await userQuery.update(id, { roleId: userRole.id });

        const user = await vwUserQuery.findUnique({ id });
        return { message: 'Usuário rebaixado para user.', email: user?.email, role: 'user' };
    }

    static async banUser(id: number) 
    {
        await AdminErrors.ensureNotMaster(id);
        await AdminErrors.ensureUserExistById(vwUserQuery, id);

        const user = await prisma.user.findUnique({ where: { id } });
        await userQuery.update(id, {
            activate: false,
            email: `banned_${id}_${user?.email}`,
            deletedAt: new Date()
        });

        return { message: 'Usuário banido.', email: user?.email, bannedAt: new Date().toISOString() };
    }
}