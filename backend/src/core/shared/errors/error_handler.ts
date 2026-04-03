import type { FastifyRequest, FastifyReply } from 'fastify';

import { BaseErrors } from '../errors/base-errors.js';
import { DatabaseErrors } from '../utils/prisma/database-errors.js';
import { TokenErrors } from '../utils/jwt/token.errors.js';

import { AuthErrors } from '../../modules/auth/auth.errors.js';

export function errorHandler(error: Error, req: FastifyRequest, reply: FastifyReply) 
{
    if (error instanceof AuthErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });



    if(error instanceof BaseErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });
    if(error instanceof DatabaseErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });
    if(error instanceof TokenErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });

    // Erro genérico 
    return reply.status(500).send({ error: error.message });
};