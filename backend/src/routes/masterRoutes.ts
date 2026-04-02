import type { FastifyInstance } from 'fastify';
import { MasterController } from '../controllers/MasterController.js';

import { promoteUserSchemaSwagger, demoteUserSchemaSwagger, banUserSchemaSwagger } from '../../documentation/master.swagger.js';

import { checkToken } from '../middlewares/check_token.js';
import { checkAccessMaster } from '../middlewares/check_acess_master.js';

export async function masterRoutes(app: FastifyInstance) {
    app.patch('/user/:id/promote', { ...promoteUserSchemaSwagger, preHandler: [checkToken, checkAccessMaster] }, MasterController.promoteUser)
    app.patch('/user/:id/demote', { ...demoteUserSchemaSwagger, preHandler: [checkToken, checkAccessMaster] }, MasterController.demoteUser)
    app.patch('/user/:id/ban', { ...banUserSchemaSwagger, preHandler: [checkToken, checkAccessMaster] }, MasterController.banUser)
}