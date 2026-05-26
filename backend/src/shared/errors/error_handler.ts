import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from './app-error.js';

export function errorHandler(error: Error, _req: FastifyRequest, reply: FastifyReply) {
    if (error instanceof AppError)
        return reply.status(error.statusCode).send({ error: error.name, message: error.message });

    return reply.status(500).send({ error: error.message });
}
