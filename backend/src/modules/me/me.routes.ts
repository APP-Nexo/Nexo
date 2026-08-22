import type { FastifyInstance, FastifyRequest } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { MeController } from './me.controller.js';
import {
    changePasswordSchemaSwagger,
    deleteMeSchemaSwagger,
    getMeSchemaSwagger,
    updateMeSchemaSwagger,
} from './me.swagger.js';

async function prepareMultipartBody(req: FastifyRequest) {
    // Multipart remains streamed through req.parts(); this value is only for JSON-schema validation.
    if (req.isMultipart()) req.body = { bio: '' };
}

export async function meRoutes(app: FastifyInstance) {
    app.get('/', { ...getMeSchemaSwagger, preHandler: [checkToken] }, MeController.getMe);
    app.put(
        '/',
        {
            ...updateMeSchemaSwagger,
            preValidation: [prepareMultipartBody],
            preHandler: [checkToken],
        },
        MeController.updateMe,
    );
    app.put(
        '/password',
        { ...changePasswordSchemaSwagger, preHandler: [checkToken] },
        MeController.changePassword,
    );
    app.delete('/', { ...deleteMeSchemaSwagger, preHandler: [checkToken] }, MeController.deleteMe);
}
