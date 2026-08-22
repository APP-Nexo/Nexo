import type { FastifyInstance } from 'fastify';
import { checkToken } from '../../shared/middlewares/check_token.js';
import { LibraryController } from './library.controller.js';
import {
    addGameToLibraryListSchemaSwagger,
    createLibraryListSchemaSwagger,
    deleteLibraryGameSchemaSwagger,
    deleteLibraryListSchemaSwagger,
    getLibraryFavoritesSchemaSwagger,
    getLibraryGamesSchemaSwagger,
    getLibraryListsSchemaSwagger,
    removeGameFromLibraryListSchemaSwagger,
    updateLibraryListSchemaSwagger,
    upsertLibraryGameSchemaSwagger,
} from './library.swagger.js';

export async function libraryRoutes(app: FastifyInstance) {
    app.get(
        '/games',
        { ...getLibraryGamesSchemaSwagger, preHandler: [checkToken] },
        LibraryController.getGames,
    );
    app.put(
        '/games/:gameId',
        { ...upsertLibraryGameSchemaSwagger, preHandler: [checkToken] },
        LibraryController.upsertGame,
    );
    app.delete(
        '/games/:gameId',
        { ...deleteLibraryGameSchemaSwagger, preHandler: [checkToken] },
        LibraryController.deleteGame,
    );
    app.get(
        '/favorites',
        { ...getLibraryFavoritesSchemaSwagger, preHandler: [checkToken] },
        LibraryController.getFavorites,
    );
    app.get(
        '/lists',
        { ...getLibraryListsSchemaSwagger, preHandler: [checkToken] },
        LibraryController.getLists,
    );
    app.post(
        '/lists',
        { ...createLibraryListSchemaSwagger, preHandler: [checkToken] },
        LibraryController.createList,
    );
    app.patch(
        '/lists/:id',
        { ...updateLibraryListSchemaSwagger, preHandler: [checkToken] },
        LibraryController.updateList,
    );
    app.delete(
        '/lists/:id',
        { ...deleteLibraryListSchemaSwagger, preHandler: [checkToken] },
        LibraryController.deleteList,
    );
    app.put(
        '/lists/:id/games/:gameId',
        { ...addGameToLibraryListSchemaSwagger, preHandler: [checkToken] },
        LibraryController.addGameToList,
    );
    app.delete(
        '/lists/:id/games/:gameId',
        { ...removeGameFromLibraryListSchemaSwagger, preHandler: [checkToken] },
        LibraryController.removeGameFromList,
    );
}
