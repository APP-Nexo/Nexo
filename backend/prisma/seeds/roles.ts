// prisma/seeds/roles.ts
import { Logs } from '../../src/helpers/utils/write_logs.js'
import { GenericQueries } from '../../src/repository/generics.js'
import prisma from '../../src/helpers/utils/prisma_conn.js'
import type { Role } from '../../src/generated/client.js'

const roleQuery = new GenericQueries<Role>(prisma.role)

const DEFAULT_ROLES = ['user', 'admin', 'master']

export async function seedRoles() {
    const existing = await roleQuery.findMany()
    const existingRoles = existing.map((r) => r.role)

    const toCreate = DEFAULT_ROLES.filter((role) => !existingRoles.includes(role))

    if (toCreate.length === 0) {
        Logs.write({ roles: existingRoles }, `Roles already up to date`, 'info', true, false)
        return
    }

    await roleQuery.createMany(toCreate.map((role) => ({ role })))
    Logs.write({ roles: [...existingRoles, ...toCreate] }, `Roles created | roles: ${toCreate.join(', ')}`, 'info', true)
}

if (process.argv[1]?.includes('roles')) {
    seedRoles().catch(console.error).finally(() => prisma.$disconnect())
}