import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserTokenPayload } from '../../shared/utils/jwt/jwt.interfaces.js';
import type {
    CreateReportPayload,
    CreateReviewPayload,
    GameIdParams,
    ReviewIdParams,
    UpdateReviewPayload,
} from './reviews.interfaces.js';
import { ReviewsService } from './reviews.service.js';

export class ReviewsController {
    static async create(request: FastifyRequest, reply: FastifyReply) {
        const user = request.user as UserTokenPayload;
        const { gameId } = request.params as GameIdParams;
        const review = await ReviewsService.create(
            user.id,
            Number(gameId),
            request.body as CreateReviewPayload,
        );
        return reply.status(201).send(review);
    }

    static async update(request: FastifyRequest, reply: FastifyReply) {
        const user = request.user as UserTokenPayload;
        const { id } = request.params as ReviewIdParams;
        const review = await ReviewsService.update(
            user.id,
            Number(id),
            request.body as UpdateReviewPayload,
        );
        return reply.status(200).send(review);
    }

    static async delete(request: FastifyRequest, reply: FastifyReply) {
        const user = request.user as UserTokenPayload;
        const { id } = request.params as ReviewIdParams;
        await ReviewsService.delete(user.id, Number(id));
        return reply.status(204).send();
    }

    static async report(request: FastifyRequest, reply: FastifyReply) {
        const user = request.user as UserTokenPayload;
        const { id } = request.params as ReviewIdParams;
        const report = await ReviewsService.report(
            user.id,
            Number(id),
            request.body as CreateReportPayload,
        );
        return reply.status(201).send(report);
    }
}
