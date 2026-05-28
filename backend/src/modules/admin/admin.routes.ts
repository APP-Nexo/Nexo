import type { FastifyInstance } from 'fastify';
import { checkAccessPerm } from '../../shared/middlewares/check_access_perm.js';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { AdminController } from './admin.controller.js';
import {
    blockUserSchemaSwagger,
    deleteReviewAdminSchemaSwagger,
    deleteUserAdminSchemaSwagger,
    getDashboardSchemaSwagger,
    getReportsSchemaSwagger,
    getReviewsModerationSchemaSwagger,
    getUserDetailSchemaSwagger,
    getUsersAdminSchemaSwagger,
    getUsersSchemaSwagger,
    getUsersStatsSchemaSwagger,
    resolveReportSchemaSwagger,
    searchUserAdminSchemaSwagger,
    unblockUserSchemaSwagger,
} from './admin.swagger.js';

export async function adminRoutes(app: FastifyInstance) {
    app.get(
        '/dashboard',
        { ...getDashboardSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.getDashboard,
    );
    app.get(
        '/user/search',
        { ...searchUserAdminSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.searchUser,
    );
    app.get(
        '/user-all',
        { ...getUsersSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.getUsers,
    );
    app.get(
        '/user/admin',
        { ...getUsersAdminSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.getUsersAdmin,
    );
    app.get(
        '/user/stats',
        { ...getUsersStatsSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.getUsersStats,
    );
    app.get(
        '/users/:id',
        { ...getUserDetailSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.getUserDetail,
    );
    app.post(
        '/users/:id/block',
        { ...blockUserSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.blockUser,
    );
    app.delete(
        '/users/:id/block',
        { ...unblockUserSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.unblockUser,
    );
    app.delete(
        '/users/:id',
        { ...deleteUserAdminSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.deleteUser,
    );
    app.get(
        '/reviews',
        { ...getReviewsModerationSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.getReviews,
    );
    app.delete(
        '/reviews/:id',
        { ...deleteReviewAdminSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.deleteReview,
    );
    app.get(
        '/reports',
        { ...getReportsSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.getReports,
    );
    app.patch(
        '/reports/:id/resolve',
        { ...resolveReportSchemaSwagger, preHandler: [checkToken, checkAccessPerm] },
        AdminController.resolveReport,
    );
}
