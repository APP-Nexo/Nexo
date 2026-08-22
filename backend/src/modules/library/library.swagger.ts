import {
    LIBRARY_MAX_LIMIT,
    LIST_NAME_MAX_LENGTH,
    PRISMA_INT_MAX,
    USER_GAME_STATUSES,
} from './library.interfaces.js';

const positiveIntegerSchema = { type: 'integer', minimum: 1, maximum: PRISMA_INT_MAX };
const nullableDateTimeSchema = { type: ['string', 'null'], format: 'date-time' };

const errorSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['code', 'message', 'requestId'],
    properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' },
    },
};

const errorResponses = {
    400: errorSchema,
    401: errorSchema,
    404: errorSchema,
    409: errorSchema,
};

const gameSummarySchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'id',
        'slug',
        'title',
        'cover',
        'releaseDate',
        'genres',
        'platforms',
        'averageRating',
    ],
    properties: {
        id: positiveIntegerSchema,
        slug: { type: 'string' },
        title: { type: 'string' },
        cover: { type: ['string', 'null'] },
        releaseDate: nullableDateTimeSchema,
        genres: { type: 'array', items: { type: 'string' } },
        platforms: { type: 'array', items: { type: 'string' } },
        averageRating: { type: 'number' },
    },
};

const libraryGameSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'id',
        'gameId',
        'status',
        'isFavorite',
        'progress',
        'startedAt',
        'completedAt',
        'createdAt',
        'updatedAt',
        'game',
    ],
    properties: {
        id: positiveIntegerSchema,
        gameId: positiveIntegerSchema,
        status: { type: 'string', enum: USER_GAME_STATUSES },
        isFavorite: { type: 'boolean' },
        progress: { type: ['integer', 'null'], minimum: 0, maximum: 100 },
        startedAt: nullableDateTimeSchema,
        completedAt: nullableDateTimeSchema,
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        game: gameSummarySchema,
    },
};

const gamesResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['games', 'nextCursor'],
    properties: {
        games: { type: 'array', items: libraryGameSchema },
        nextCursor: { type: ['integer', 'null'], minimum: 1 },
    },
};

const libraryListItemSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'listId', 'gameId', 'addedAt', 'game'],
    properties: {
        id: positiveIntegerSchema,
        listId: positiveIntegerSchema,
        gameId: positiveIntegerSchema,
        addedAt: { type: 'string', format: 'date-time' },
        game: gameSummarySchema,
    },
};

const libraryListSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'name', 'isPublic', 'itemCount', 'createdAt', 'updatedAt', 'items'],
    properties: {
        id: positiveIntegerSchema,
        name: { type: 'string', minLength: 1, maxLength: LIST_NAME_MAX_LENGTH },
        isPublic: { type: 'boolean' },
        itemCount: { type: 'integer', minimum: 0 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        items: { type: 'array', items: libraryListItemSchema },
    },
};

const gameParamsSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['gameId'],
    properties: { gameId: positiveIntegerSchema },
};

const listParamsSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: { id: positiveIntegerSchema },
};

const listGameParamsSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'gameId'],
    properties: { id: positiveIntegerSchema, gameId: positiveIntegerSchema },
};

const paginationProperties = {
    status: { type: 'string', enum: USER_GAME_STATUSES },
    cursor: positiveIntegerSchema,
    limit: { type: 'integer', minimum: 1, maximum: LIBRARY_MAX_LIMIT },
};

const listNameSchema = {
    type: 'string',
    minLength: 1,
    maxLength: LIST_NAME_MAX_LENGTH,
    pattern: '\\S',
};

export const getLibraryGamesSchemaSwagger = {
    schema: {
        tags: ['Library'],
        summary: '/library/games',
        security: [{ bearerAuth: [] }],
        querystring: {
            type: 'object',
            additionalProperties: false,
            properties: {
                ...paginationProperties,
                favorite: { type: 'boolean' },
            },
        },
        response: { 200: gamesResponseSchema, ...errorResponses },
    },
};

export const upsertLibraryGameSchemaSwagger = {
    schema: {
        tags: ['Library'],
        summary: '/library/games/:gameId',
        security: [{ bearerAuth: [] }],
        params: gameParamsSchema,
        body: {
            type: 'object',
            additionalProperties: false,
            minProperties: 1,
            properties: {
                status: { type: 'string', enum: USER_GAME_STATUSES },
                isFavorite: { type: 'boolean' },
                progress: { type: 'integer', minimum: 0, maximum: 100 },
            },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['game'],
                properties: { game: libraryGameSchema },
            },
            ...errorResponses,
        },
    },
};

export const deleteLibraryGameSchemaSwagger = {
    schema: {
        tags: ['Library'],
        summary: '/library/games/:gameId',
        security: [{ bearerAuth: [] }],
        params: gameParamsSchema,
        response: { 204: { type: 'null', description: 'Jogo removido.' }, ...errorResponses },
    },
};

export const getLibraryFavoritesSchemaSwagger = {
    schema: {
        tags: ['Library'],
        summary: '/library/favorites',
        security: [{ bearerAuth: [] }],
        querystring: {
            type: 'object',
            additionalProperties: false,
            properties: paginationProperties,
        },
        response: { 200: gamesResponseSchema, ...errorResponses },
    },
};

export const getLibraryListsSchemaSwagger = {
    schema: {
        tags: ['Library'],
        summary: '/library/lists',
        security: [{ bearerAuth: [] }],
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['lists'],
                properties: { lists: { type: 'array', items: libraryListSchema } },
            },
            ...errorResponses,
        },
    },
};

export const createLibraryListSchemaSwagger = {
    schema: {
        tags: ['Library'],
        summary: '/library/lists',
        security: [{ bearerAuth: [] }],
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['name'],
            properties: { name: listNameSchema, isPublic: { type: 'boolean' } },
        },
        response: {
            201: {
                type: 'object',
                additionalProperties: false,
                required: ['list'],
                properties: { list: libraryListSchema },
            },
            ...errorResponses,
        },
    },
};

export const updateLibraryListSchemaSwagger = {
    schema: {
        tags: ['Library'],
        summary: '/library/lists/:id',
        security: [{ bearerAuth: [] }],
        params: listParamsSchema,
        body: {
            type: 'object',
            additionalProperties: false,
            minProperties: 1,
            properties: { name: listNameSchema, isPublic: { type: 'boolean' } },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['list'],
                properties: { list: libraryListSchema },
            },
            ...errorResponses,
        },
    },
};

export const deleteLibraryListSchemaSwagger = {
    schema: {
        tags: ['Library'],
        summary: '/library/lists/:id',
        security: [{ bearerAuth: [] }],
        params: listParamsSchema,
        response: { 204: { type: 'null', description: 'Lista removida.' }, ...errorResponses },
    },
};

export const addGameToLibraryListSchemaSwagger = {
    schema: {
        tags: ['Library'],
        summary: '/library/lists/:id/games/:gameId',
        security: [{ bearerAuth: [] }],
        params: listGameParamsSchema,
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['item'],
                properties: { item: libraryListItemSchema },
            },
            ...errorResponses,
        },
    },
};

export const removeGameFromLibraryListSchemaSwagger = {
    schema: {
        tags: ['Library'],
        summary: '/library/lists/:id/games/:gameId',
        security: [{ bearerAuth: [] }],
        params: listGameParamsSchema,
        response: {
            204: { type: 'null', description: 'Jogo removido da lista.' },
            ...errorResponses,
        },
    },
};
