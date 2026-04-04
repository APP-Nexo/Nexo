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
    app.patch(
        '/user/:id/promote',
        {
            ...promoteUserSchemaSwagger,
            preHandler: [checkToken, checkAccessMaster],
        },
        MasterController.promoteUser,
    );
    app.patch(
        '/user/:id/demote',
        { ...demoteUserSchemaSwagger, preHandler: [checkToken, checkAccessMaster] },
        MasterController.demoteUser,
    );
    app.patch(
        '/user/:id/ban',
        { ...banUserSchemaSwagger, preHandler: [checkToken, checkAccessMaster] },
        MasterController.banUser,
    );
}
