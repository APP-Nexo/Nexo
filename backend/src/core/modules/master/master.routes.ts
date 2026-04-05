import type { FastifyInstance } from 'fastify';
import { checkAccessMaster } from '../../shared/middlewares/check_acess_master.js';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { MasterController } from './master.controller.js';
import {
    banUserSchemaSwagger,
    demoteUserSchemaSwagger,
    promoteUserSchemaSwagger,
} from './master.swagger.js';

export async function masterRoutes(app: FastifyInstance) {
    app.patch('/user/:id/promote', {
        ...promoteUserSchemaSwagger,
        preHandler: [checkToken, checkAccessMaster],
        config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    }, MasterController.promoteUser);

    app.patch('/user/:id/demote', {
        ...demoteUserSchemaSwagger,
        preHandler: [checkToken, checkAccessMaster],
        config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    }, MasterController.demoteUser);

    app.patch('/user/:id/ban', {
        ...banUserSchemaSwagger,
        preHandler: [checkToken, checkAccessMaster],
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    }, MasterController.banUser);
}