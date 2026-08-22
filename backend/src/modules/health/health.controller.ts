import type { FastifyReply, FastifyRequest } from 'fastify';
import { HealthService } from './health.service.js';

export class HealthController {
    // ============================================================
    //  @get: /api/verify/health
    //  @returns: { message: 'healthy', uptime: process.uptime() }
    //  @status:  200
    // ============================================================
    static async health(_req: FastifyRequest, reply: FastifyReply) {
        const response = HealthService.health();
        return reply.send(response);
    }

    static async ready(_req: FastifyRequest, reply: FastifyReply) {
        const response = await HealthService.ready();
        return reply.send(response);
    }

    // ============================================================
    //  @get: /api/verify/ping
    //  @returns: { message: 'pong', timestamp: new Date() }
    //  @status:  200
    // ============================================================
    static async ping(_req: FastifyRequest, reply: FastifyReply) {
        const response = HealthService.ping();
        return reply.send(response);
    }
}
