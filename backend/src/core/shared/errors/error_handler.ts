import type { FastifyRequest, FastifyReply } from 'fastify';

import { TokenErrors } from '../utils/jwt/token.errors.js';

import { AuthErrors } from '../../modules/auth/auth.errors.js';
import { FollowErrors } from '../../modules/follow/follow.errors.js';
import { MasterErrors } from '../../modules/master/master.errors.js';
import { NotificationErrors } from '../../modules/notification/notificiation.errors.js';

export function errorHandler(error: Error, req: FastifyRequest, reply: FastifyReply) 
{
    if (error instanceof AuthErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });
    if (error instanceof FollowErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });
    if (error instanceof MasterErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });
    if (error instanceof NotificationErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });

    if(error instanceof TokenErrors) return reply.status(error.statusCode).send({ error: error.name, message: error.message });

    // Erro genérico 
    return reply.status(500).send({ error: error.message });
};