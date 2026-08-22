import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from './app-error.js';

export function errorHandler(error: FastifyError, req: FastifyRequest, reply: FastifyReply) {
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            code: error.name,
            message: error.message,
            requestId: req.id,
        });
    }

    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        return reply.status(error.statusCode).send({
            code: error.code ?? 'BAD_REQUEST',
            message: error.message,
            requestId: req.id,
        });
    }

    req.log.error({ err: error }, 'Erro não tratado');
    return reply.status(500).send({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro interno do servidor.',
        requestId: req.id,
    });
}
