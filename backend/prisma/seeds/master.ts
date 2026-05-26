import 'dotenv/config';

import { encryptPassword } from '../../src/shared/utils/argon2/encrypt_password.js';
import { Logs } from '../../src/shared/utils/log/write_logs.js';
import prisma from '../../src/shared/utils/prisma/prisma_conn.js';

export async function seedMaster() {
    const masterRole = await prisma.role.findUnique({
        where: { role: 'master' },
    });
    if (!masterRole) {
        Logs.write(
            { master: { email: process.env.MASTER_EMAIL } },
            `Role 'master' not found, run sync:roles first`,
            'warn',
            true,
            false,
        );
        return;
    }

    const existing = await prisma.user.findFirst({
        where: { roleId: masterRole.id },
    });
    if (existing) {
        Logs.write(
            { master: { email: process.env.MASTER_EMAIL } },
            `Master user already exists`,
            'info',
            true,
            false,
        );
        return;
    }

    await prisma.user.create({
        data: {
            name: 'Master',
            email: process.env.MASTER_EMAIL!,
            password: await encryptPassword(process.env.MASTER_PASSWORD!),
            roleId: masterRole.id,
            profile: { create: {} },
        },
    });

    Logs.write(
        { master: { email: process.env.MASTER_EMAIL } },
        `Master user created`,
        'info',
        true,
    );
}

if (process.argv[1]?.includes('master')) {
    seedMaster()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
