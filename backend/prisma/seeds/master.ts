import 'dotenv/config';

import { encryptPassword } from '../../src/shared/utils/argon2/encrypt_password.js';
import { Logs } from '../../src/shared/utils/log/write_logs.js';
import prisma from '../../src/shared/utils/prisma/prisma_conn.js';

export async function seedMaster() {
    const email = process.env.MASTER_EMAIL?.trim().toLowerCase();
    const password = process.env.MASTER_PASSWORD;
    if (!email && !password) return;
    if (!email || !password || password.length < 12) {
        throw new Error(
            'MASTER_EMAIL e MASTER_PASSWORD (mínimo de 12 caracteres) são obrigatórios.',
        );
    }

    const masterRole = await prisma.role.findUnique({
        where: { role: 'master' },
    });
    if (!masterRole) {
        Logs.write(
            { master: { configured: true } },
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
            { master: { configured: true } },
            `Master user already exists`,
            'info',
            true,
            false,
        );
        return;
    }

    await prisma.user.create({
        data: {
            username: 'master',
            email,
            password: await encryptPassword(password),
            roleId: masterRole.id,
            profile: { create: {} },
        },
    });

    Logs.write({ master: { configured: true } }, `Master user created`, 'info', true);
}

if (process.argv[1]?.includes('master')) {
    seedMaster()
        .catch((error) => {
            console.error(error);
            process.exitCode = 1;
        })
        .finally(() => prisma.$disconnect());
}
