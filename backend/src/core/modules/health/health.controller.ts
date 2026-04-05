import type { FastifyReply, FastifyRequest } from 'fastify';
import { HealthService } from './health.service.js';

export class HealthController {
    // ============================================================
    //  @get: /api/verify/health
    //  @returns: { message: 'healthy', uptime: process.uptime() }
    //  @status:  200
    // ============================================================
    static async health(req: FastifyRequest, reply: FastifyReply) {
        const response = HealthService.health();
        return reply.send(response);
    }

    // ============================================================
    //  @get: /api/verify/ping
    //  @returns: { message: 'pong', timestamp: new Date() }
    //  @status:  200
    // ============================================================
    static async ping(req: FastifyRequest, reply: FastifyReply) {
        const response = HealthService.ping();
        return reply.send(response);
    }
}
