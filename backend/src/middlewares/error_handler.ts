import type { FastifyRequest, FastifyReply } from 'fastify';

import { BaseErrors } from '../helpers/errors/base-errors.js';
import { DatabaseErrors } from '../helpers/errors/database-errors.js';
import { TokenErrors } from '../helpers/errors/token-erros.js';

export function errorHandler(error: Error, req: FastifyRequest, reply: FastifyReply) 
{
    if(error instanceof BaseErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });
    if(error instanceof DatabaseErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });
    if(error instanceof TokenErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });

    // Erro genérico 
    return reply.status(500).send({ error: error.message });
};