const nullableStringSchema = {
    anyOf: [{ type: 'string' }, { type: 'null' }],
};

const nullableDateTimeSchema = {
    anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
};

const gameProperties = {
    id: { type: 'integer', minimum: 1 },
    source: { type: 'string' },
    externalId: nullableStringSchema,
    slug: { type: 'string' },
    title: { type: 'string' },
    cover: nullableStringSchema,
    artwork: nullableStringSchema,
    description: nullableStringSchema,
    releaseDate: nullableDateTimeSchema,
    genres: { type: 'array', items: { type: 'string' } },
    platforms: { type: 'array', items: { type: 'string' } },
    developer: nullableStringSchema,
    publisher: nullableStringSchema,
    popularity: { type: 'number' },
    igdbRating: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    igdbRatingCount: { type: 'integer', minimum: 0 },
    ratingSum: { type: 'integer', minimum: 0 },
    ratingCount: { type: 'integer', minimum: 0 },
    averageRating: { type: 'number', minimum: 0 },
    cachedAt: { type: 'string', format: 'date-time' },
};

const gameRequired = [
    'id',
    'source',
    'externalId',
    'slug',
    'title',
    'cover',
    'artwork',
    'description',
    'releaseDate',
    'genres',
    'platforms',
    'developer',
    'publisher',
    'popularity',
    'igdbRating',
    'igdbRatingCount',
    'ratingSum',
    'ratingCount',
    'averageRating',
    'cachedAt',
];

export const gameResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: gameRequired,
    properties: gameProperties,
};

const cursorSchema = {
    anyOf: [{ type: 'string', pattern: '^[1-9][0-9]*$' }, { type: 'null' }],
};

const errorResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['code', 'message', 'requestId'],
    properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' },
    },
};

const listQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        q: { type: 'string', minLength: 1, maxLength: 100 },
        genre: { type: 'string', minLength: 1, maxLength: 80 },
        platform: { type: 'string', minLength: 1, maxLength: 80 },
        cursor: { type: 'string', pattern: '^[1-9][0-9]*$', maxLength: 10 },
        limit: { type: 'integer', minimum: 1, maximum: 50 },
    },
};

const gamesPageSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['data', 'nextCursor'],
    properties: {
        data: { type: 'array', items: gameResponseSchema },
        nextCursor: cursorSchema,
    },
};

const gameParamsSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: {
        id: { type: 'integer', minimum: 1, maximum: 2_147_483_647 },
    },
};

const libraryStateSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['status', 'isFavorite', 'progress', 'startedAt', 'completedAt', 'updatedAt'],
    properties: {
        status: {
            type: 'string',
            enum: ['want_to_play', 'playing', 'completed', 'tried', 'abandoned'],
        },
        isFavorite: { type: 'boolean' },
        progress: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
        startedAt: nullableDateTimeSchema,
        completedAt: nullableDateTimeSchema,
        updatedAt: { type: 'string', format: 'date-time' },
    },
};

const viewerReviewSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'rating', 'text', 'status', 'createdAt', 'updatedAt'],
    properties: {
        id: { type: 'integer', minimum: 1 },
        rating: { type: 'integer' },
        text: nullableStringSchema,
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
};

const viewerSchema = {
    anyOf: [
        {
            type: 'object',
            additionalProperties: false,
            required: ['library', 'review'],
            properties: {
                library: { anyOf: [libraryStateSchema, { type: 'null' }] },
                review: { anyOf: [viewerReviewSchema, { type: 'null' }] },
            },
        },
        { type: 'null' },
    ],
};

const gameDetailSchema = {
    type: 'object',
    additionalProperties: false,
    required: [...gameRequired, 'viewer'],
    properties: {
        ...gameProperties,
        viewer: viewerSchema,
    },
};

const reviewSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'id',
        'userId',
        'gameId',
        'rating',
        'text',
        'status',
        'createdAt',
        'updatedAt',
        'user',
    ],
    properties: {
        id: { type: 'integer', minimum: 1 },
        userId: { type: 'integer', minimum: 1 },
        gameId: { type: 'integer', minimum: 1 },
        rating: { type: 'integer' },
        text: nullableStringSchema,
        status: { type: 'string', enum: ['approved'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        user: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'username', 'photo'],
            properties: {
                id: { type: 'integer', minimum: 1 },
                username: { type: 'string' },
                photo: nullableStringSchema,
            },
        },
    },
};

const reviewsPageSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['data', 'nextCursor'],
    properties: {
        data: { type: 'array', items: reviewSchema },
        nextCursor: cursorSchema,
    },
};

const paginationQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        cursor: { type: 'string', pattern: '^[1-9][0-9]*$', maxLength: 10 },
        limit: { type: 'integer', minimum: 1, maximum: 50 },
    },
};

export const listGamesSchema = {
    tags: ['Games'],
    summary: 'List cached games',
    security: [],
    querystring: listQuerySchema,
    response: {
        200: gamesPageSchema,
        400: errorResponseSchema,
    },
};

export const searchGamesSchema = {
    ...listGamesSchema,
    summary: 'Search cached games and refresh from IGDB when needed',
};

export const trendingGamesSchema = {
    tags: ['Games'],
    summary: 'List trending cached games',
    security: [],
    querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {
            limit: { type: 'integer', minimum: 1, maximum: 50 },
        },
    },
    response: {
        200: {
            type: 'object',
            additionalProperties: false,
            required: ['data'],
            properties: {
                data: { type: 'array', items: gameResponseSchema },
            },
        },
        400: errorResponseSchema,
    },
};

export const getGameSchema = {
    tags: ['Games'],
    summary: 'Get a game with optional authenticated viewer state',
    security: [{}, { bearerAuth: [] }],
    params: gameParamsSchema,
    response: {
        200: gameDetailSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
    },
};

export const getGameReviewsSchema = {
    tags: ['Games'],
    summary: 'List approved reviews for a game',
    security: [],
    params: gameParamsSchema,
    querystring: paginationQuerySchema,
    response: {
        200: reviewsPageSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
    },
};
