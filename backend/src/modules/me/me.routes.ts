import type { FastifyInstance } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { MeController } from './me.controller.js';
import {
    changePasswordSchemaSwagger,
    deleteMeSchemaSwagger,
    getMeSchemaSwagger,
    updateMeSchemaSwagger,
} from './me.swagger.js';

export async function meRoutes(app: FastifyInstance) {
    app.get('/', { ...getMeSchemaSwagger, preHandler: [checkToken] }, MeController.getMe);
    app.put('/', { ...updateMeSchemaSwagger, preHandler: [checkToken] }, MeController.updateMe);
    app.put(
        '/password',
        { ...changePasswordSchemaSwagger, preHandler: [checkToken] },
        MeController.changePassword,
    );
    app.delete('/', { ...deleteMeSchemaSwagger, preHandler: [checkToken] }, MeController.deleteMe);
}
