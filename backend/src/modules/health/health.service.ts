import { AppError } from '../../shared/errors/app-error.js';
import prisma from '../../shared/utils/prisma/prisma_conn.js';

export class HealthService {
    static health() {
        return { message: 'healthy', uptime: process.uptime() };
    }

    static ping() {
        return { message: 'pong', timestamp: new Date() };
    }

    static async ready() {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return { message: 'ready', database: 'reachable', uptime: process.uptime() };
        } catch {
            AppError.throw('Banco de dados indisponível.', 503);
        }
    }
}
