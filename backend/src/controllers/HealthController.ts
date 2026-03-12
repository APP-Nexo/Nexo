import type { FastifyRequest, FastifyReply } from 'fastify';

export class HealthController 
{
    static async health(req: FastifyRequest, reply: FastifyReply) 
    {
        return reply.send({ message: 'healthy', uptime: process.uptime() });
    }

    static async ping(req: FastifyRequest, reply: FastifyReply) 
    {
        return reply.send({ message: 'pong', timestamp: new Date() });
    }
}