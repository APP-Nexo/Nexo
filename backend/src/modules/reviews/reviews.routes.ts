import type { FastifyInstance } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { ReviewsController } from './reviews.controller.js';
import {
    createReviewSchemaSwagger,
    deleteReviewSchemaSwagger,
    reportReviewSchemaSwagger,
    updateReviewSchemaSwagger,
} from './reviews.swagger.js';

export async function reviewsRoutes(app: FastifyInstance) {
    app.post(
        '/game/:gameId',
        { ...createReviewSchemaSwagger, preHandler: [checkToken] },
        ReviewsController.create,
    );
    app.patch(
        '/:id',
        { ...updateReviewSchemaSwagger, preHandler: [checkToken] },
        ReviewsController.update,
    );
    app.delete(
        '/:id',
        { ...deleteReviewSchemaSwagger, preHandler: [checkToken] },
        ReviewsController.delete,
    );
    app.post(
        '/:id/reports',
        { ...reportReviewSchemaSwagger, preHandler: [checkToken] },
        ReviewsController.report,
    );
}
