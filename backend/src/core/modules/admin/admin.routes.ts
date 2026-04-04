import type { FastifyInstance } from 'fastify';
import { checkAccessPerm } from '../../shared/middlewares/check_acess_perm.js';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { AdminController } from './admin.controller.js';
import {
    getUsersAdminSchemaSwagger,
    getUsersSchemaSwagger,
    getUsersStatsSchemaSwagger,
    searchUserAdminSchemaSwagger,
} from './admin.swagger.js';

export async function adminRoutes(app: FastifyInstance) {
    app.get(
        '/user/search',
        {
            ...searchUserAdminSchemaSwagger,
            preHandler: [checkToken, checkAccessPerm],
        },
        AdminController.searchUser,
    );
    app.get(
        '/user/all',
        { ...getUsersSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.getUsers,
    );
    app.get(
        '/user/admin',
        {
            ...getUsersAdminSchemaSwagger,
            preHandler: [checkToken, checkAccessPerm],
        },
        AdminController.getUsersAdmin,
    );
    app.get(
        '/user/stats',
        {
            ...getUsersStatsSchemaSwagger,
            preHandler: [checkToken, checkAccessPerm],
        },
        AdminController.getUsersStats,
    );
}
