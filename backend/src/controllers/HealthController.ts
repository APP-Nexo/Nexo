import type { FastifyRequest, FastifyReply } from 'fastify';

export class HealthController 
{
    
    // ============================================================
    //  health: @get
    //  @returns: { message: 'healthy', uptime: process.uptime() }
    //  @status:  200 
    // ============================================================
    static async health(req: FastifyRequest, reply: FastifyReply) 
    {
        return reply.send({ message: 'healthy', uptime: process.uptime() });
    }

    // ============================================================
    //  ping: @get
    //  @returns: { message: 'pong', timestamp: new Date() }
    //  @status:  200 
    // ============================================================
    static async ping(req: FastifyRequest, reply: FastifyReply) 
    {
        return reply.send({ message: 'pong', timestamp: new Date() });
    }
}