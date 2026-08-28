import { PRISMA_INT_MAX } from '../../shared/infrastructure/validation/prisma-values.js';

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

const usernameParamsSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['username'],
    properties: { username: { type: 'string', minLength: 1 } },
};

const profileSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'id',
        'username',
        'bio',
        'photo',
        'banner',
        'followersCount',
        'followingCount',
        'createdAt',
        'isFollowing',
    ],
    properties: {
        id: { type: 'integer', minimum: 1 },
        username: { type: 'string' },
        bio: { type: ['string', 'null'] },
        photo: { type: ['string', 'null'] },
        banner: { type: ['string', 'null'] },
        followersCount: { type: 'integer', minimum: 0 },
        followingCount: { type: 'integer', minimum: 0 },
        createdAt: { type: 'string', format: 'date-time' },
        isFollowing: { type: 'boolean' },
    },
};

const gameSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'title', 'cover'],
    properties: {
        id: { type: 'integer', minimum: 1 },
        title: { type: 'string' },
        cover: { type: ['string', 'null'] },
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
        'game',
    ],
    properties: {
        id: { type: 'integer', minimum: 1 },
        userId: { type: 'integer', minimum: 1 },
        gameId: { type: 'integer', minimum: 1 },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        text: { type: ['string', 'null'] },
        status: { type: 'string', enum: ['approved'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        game: gameSchema,
    },
};

const listItemSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'listId', 'gameId', 'addedAt', 'game'],
    properties: {
        id: { type: 'integer', minimum: 1 },
        listId: { type: 'integer', minimum: 1 },
        gameId: { type: 'integer', minimum: 1 },
        addedAt: { type: 'string', format: 'date-time' },
        game: gameSchema,
    },
};

const listSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'userId', 'name', 'isPublic', 'itemCount', 'createdAt', 'updatedAt', 'items'],
    properties: {
        id: { type: 'integer', minimum: 1 },
        userId: { type: 'integer', minimum: 1 },
        name: { type: 'string' },
        isPublic: { type: 'boolean' },
        itemCount: { type: 'integer', minimum: 0 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        items: { type: 'array', items: listItemSchema },
    },
};

export const getUserProfileSchemaSwagger = {
    schema: {
        tags: ['Users'],
        summary: '/users/:username',
        security: [{ bearerAuth: [] }],
        params: usernameParamsSchema,
        response: { 200: profileSchema, 401: errorSchema, 404: errorSchema },
    },
};

export const getUserReviewsSchemaSwagger = {
    schema: {
        tags: ['Users'],
        summary: '/users/:username/reviews',
        security: [{ bearerAuth: [] }],
        params: usernameParamsSchema,
        querystring: {
            type: 'object',
            additionalProperties: false,
            properties: {
                cursor: { type: 'integer', minimum: 1, maximum: PRISMA_INT_MAX },
            },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['reviews', 'nextCursor'],
                properties: {
                    reviews: { type: 'array', items: reviewSchema },
                    nextCursor: { type: ['integer', 'null'], minimum: 1 },
                },
            },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
        },
    },
};

export const getUserStatsSchemaSwagger = {
    schema: {
        tags: ['Users'],
        summary: '/users/:username/stats',
        security: [],
        params: usernameParamsSchema,
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: [
                    'totalReviews',
                    'averageRating',
                    'totalGames',
                    'followersCount',
                    'followingCount',
                    'memberSince',
                ],
                properties: {
                    totalReviews: { type: 'integer', minimum: 0 },
                    averageRating: { type: ['number', 'null'] },
                    totalGames: { type: 'integer', minimum: 0 },
                    followersCount: { type: 'integer', minimum: 0 },
                    followingCount: { type: 'integer', minimum: 0 },
                    memberSince: { type: 'string', format: 'date-time' },
                },
            },
            404: errorSchema,
        },
    },
};

export const getUserListsSchemaSwagger = {
    schema: {
        tags: ['Users'],
        summary: '/users/:username/lists',
        security: [{ bearerAuth: [] }],
        params: usernameParamsSchema,
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['lists'],
                properties: { lists: { type: 'array', items: listSchema } },
            },
            401: errorSchema,
            404: errorSchema,
        },
    },
};

export const getUserProfileByFriendlyIdSchemaSwagger = {
    schema: {
        tags: ['Users'],
        summary: '/users/friendly/:friendlyId',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            additionalProperties: false,
            required: ['friendlyId'],
            properties: { friendlyId: { type: 'string', minLength: 1 } },
        },
        response: { 200: profileSchema, 401: errorSchema, 404: errorSchema },
    },
};
