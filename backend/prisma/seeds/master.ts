import 'dotenv/config'

import { Logs } from '../../src/core/shared/utils/log/write_logs.js';
import { GenericQueries } from "../../src/core/shared/repository/generics.js";
import prisma from "../../src/core/shared/utils/prisma/prisma_conn.js";
import type { User, Role } from '../../src/core/generated/client.js';
import { encryptPassword } from '../../src/core/shared/utils/bcrypt/encrypt_password.js';

const userQuery = new GenericQueries<User>(prisma.user)
const roleQuery = new GenericQueries<Role>(prisma.role)

export async function seedMaster() {
    const masterRole = await roleQuery.findUnique({ role: 'master' })
    if (!masterRole) {
        Logs.write({ master: { email: process.env.MASTER_EMAIL } }, `Role 'master' not found, run sync:roles first`, 'warn', true, false)
        return
    }

    const existing = await userQuery.findFirst({ roleId: masterRole.id })
    if (existing) {
        Logs.write({ master: { email: process.env.MASTER_EMAIL } }, `Master user already exists`, 'info', true, false)
        return
    }

    await userQuery.create({
        name: 'Master',
        email: process.env.MASTER_EMAIL!,
        password: await encryptPassword(process.env.MASTER_PASSWORD!),
        roleId: masterRole.id,
        profile: { create: {} }
    })

    Logs.write({ master: { email: process.env.MASTER_EMAIL } }, `Master user created`, 'info', true)
}

if (process.argv[1]?.includes('master')) {
    seedMaster().catch(console.error).finally(() => prisma.$disconnect())
}