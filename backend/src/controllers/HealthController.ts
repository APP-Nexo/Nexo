import type { FastifyRequest, FastifyReply } from 'fastify';

export class HealthController 
{
    
    // ============================================================
    //  @get
    //  @return: { message: 'healthy', uptime: process.uptime() }
    //  @status:  200 
    // ============================================================
    static async health(req: FastifyRequest, reply: FastifyReply) 
    {
        return reply.send({ message: 'healthy', uptime: process.uptime() });
    }

    // ============================================================
    //  @get
    //  @return: { message: 'pong', timestamp: new Date() }
    //  @status:  200 
    // ============================================================
    static async ping(req: FastifyRequest, reply: FastifyReply) 
    {
        return reply.send({ message: 'pong', timestamp: new Date() });
    }
}