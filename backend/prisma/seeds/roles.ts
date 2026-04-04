// prisma/seeds/roles.ts

import type { Role } from '../../src/core/generated/client.js';
import { Logs } from '../../src/core/shared/utils/log/write_logs.js';
import prisma from '../../src/core/shared/utils/prisma/prisma_conn.js';

const DEFAULT_ROLES = ['user', 'admin', 'master'];

export async function seedRoles() {
    const existing = await prisma.role.findMany();
    const existingRoles = existing.map((r) => r.role);

    const toCreate = DEFAULT_ROLES.filter((role) => !existingRoles.includes(role));

    if (toCreate.length === 0) {
        Logs.write({ roles: existingRoles }, `Roles already up to date`, 'info', true, false);
        return;
    }

    await prisma.role.createMany({ data: toCreate.map((role) => ({ role })) });
    Logs.write(
        { roles: [...existingRoles, ...toCreate] },
        `Roles created | roles: ${toCreate.join(', ')}`,
        'info',
        true,
    );
}

if (process.argv[1]?.includes('roles')) {
    seedRoles()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
