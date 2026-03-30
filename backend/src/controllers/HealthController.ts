import type { FastifyRequest, FastifyReply } from 'fastify';

export class HealthController 
{
    
    // ============================================================
    //  health 
    //  @params:  {FastifyRequest} req, {FastifyReply} reply
    //  @returns: { message: 'healthy', uptime: process.uptime() }
    //  @status:  200 OK
    // ============================================================
    static async health(req: FastifyRequest, reply: FastifyReply) 
    {
        return reply.send({ message: 'healthy', uptime: process.uptime() });
    }

    // ============================================================
    //  ping
    //  @params:  {FastifyRequest} req, {FastifyReply} reply
    //  @returns: { message: 'pong', timestamp: new Date() }
    //  @status:  200 OK
    // ============================================================
    static async ping(req: FastifyRequest, reply: FastifyReply) 
    {
        return reply.send({ message: 'pong', timestamp: new Date() });
    }
}