import type { FastifyInstance } from 'fastify';
import { GamesController } from './games.controller.js';
import {
    getGameReviewsSchema,
    getGameSchema,
    listGamesSchema,
    searchGamesSchema,
    trendingGamesSchema,
} from './games.schemas.js';

export async function gamesRoutes(app: FastifyInstance) {
    app.get('/search', { schema: searchGamesSchema }, GamesController.list);
    app.get('/trending', { schema: trendingGamesSchema }, GamesController.trending);
    app.get('/', { schema: listGamesSchema }, GamesController.list);
    app.get('/:id/reviews', { schema: getGameReviewsSchema }, GamesController.reviews);
    app.get('/:id', { schema: getGameSchema }, GamesController.detail);
}

export async function gamesSearchAliasRoutes(app: FastifyInstance) {
    app.get('/games', { schema: searchGamesSchema }, GamesController.list);
}
