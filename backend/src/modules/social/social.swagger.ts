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

const paginationQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: { cursor: { type: 'integer', minimum: 1, maximum: 2_147_483_647 } },
};

const messageSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['message'],
    properties: { message: { type: 'string' } },
};

const socialUserSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'username', 'photo', 'isFollowing'],
    properties: {
        id: { type: 'integer', minimum: 1 },
        username: { type: 'string' },
        photo: { type: ['string', 'null'] },
        isFollowing: { type: 'boolean' },
    },
};

const feedReviewSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'gameId', 'gameTitle', 'gameCover', 'rating', 'text'],
    properties: {
        id: { type: 'integer', minimum: 1 },
        gameId: { type: 'integer', minimum: 1 },
        gameTitle: { type: 'string' },
        gameCover: { type: ['string', 'null'] },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        text: { type: ['string', 'null'] },
    },
};

const feedItemSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'type', 'userId', 'userUsername', 'userPhoto', 'createdAt', 'review'],
    properties: {
        id: { type: 'integer', minimum: 1 },
        type: { type: 'string', enum: ['review'] },
        userId: { type: 'integer', minimum: 1 },
        userUsername: { type: 'string' },
        userPhoto: { type: ['string', 'null'] },
        createdAt: { type: 'string', format: 'date-time' },
        review: feedReviewSchema,
    },
};

export const followUserSchemaSwagger = {
    schema: {
        tags: ['Social'],
        summary: '/social/:username/follow',
        security: [{ bearerAuth: [] }],
        params: usernameParamsSchema,
        response: { 201: messageSchema, 400: errorSchema, 401: errorSchema, 404: errorSchema },
    },
};

export const unfollowUserSchemaSwagger = {
    schema: {
        tags: ['Social'],
        summary: '/social/:username/follow',
        security: [{ bearerAuth: [] }],
        params: usernameParamsSchema,
        response: { 200: messageSchema, 400: errorSchema, 401: errorSchema, 404: errorSchema },
    },
};

export const getFollowersSchemaSwagger = {
    schema: {
        tags: ['Social'],
        summary: '/social/:username/followers',
        security: [{ bearerAuth: [] }],
        params: usernameParamsSchema,
        querystring: paginationQuerySchema,
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['followers', 'nextCursor'],
                properties: {
                    followers: { type: 'array', items: socialUserSchema },
                    nextCursor: { type: ['integer', 'null'], minimum: 1 },
                },
            },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
        },
    },
};

export const getFollowingSchemaSwagger = {
    schema: {
        tags: ['Social'],
        summary: '/social/:username/following',
        security: [{ bearerAuth: [] }],
        params: usernameParamsSchema,
        querystring: paginationQuerySchema,
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['following', 'nextCursor'],
                properties: {
                    following: { type: 'array', items: socialUserSchema },
                    nextCursor: { type: ['integer', 'null'], minimum: 1 },
                },
            },
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
        },
    },
};

export const getFeedSchemaSwagger = {
    schema: {
        tags: ['Social'],
        summary: '/social/feed',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema,
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['feed', 'nextCursor'],
                properties: {
                    feed: { type: 'array', items: feedItemSchema },
                    nextCursor: { type: ['integer', 'null'], minimum: 1 },
                },
            },
            400: errorSchema,
            401: errorSchema,
        },
    },
};
