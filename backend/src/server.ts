import { app } from './conf.js';
import { assertRuntimeEnv, env } from './shared/config/env.js';
import prisma from './shared/utils/prisma/prisma_conn.js';

async function shutdown(signal: string) {
    app.log.info({ signal }, 'Encerrando servidor');
    await app.close();
    await prisma.$disconnect();
}

async function main() {
    try {
        assertRuntimeEnv();
        await app.listen({ host: env.host, port: env.port });
        const protocol = env.tlsKeyPath && env.tlsCertPath ? 'https' : 'http';
        app.log.info(`Servidor disponível em ${protocol}://${env.host}:${env.port}`);
        app.log.info(`Swagger disponível em ${protocol}://${env.host}:${env.port}/docs`);

        process.once('SIGINT', () => void shutdown('SIGINT'));
        process.once('SIGTERM', () => void shutdown('SIGTERM'));
    } catch (error) {
        app.log.error(error);
        await prisma.$disconnect();
        process.exitCode = 1;
    }
}

void main();
