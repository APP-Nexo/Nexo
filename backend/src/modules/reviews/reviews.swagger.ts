const idParamsSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: {
        id: { type: 'integer', minimum: 1, maximum: 2_147_483_647 },
    },
};

const gameIdParamsSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['gameId'],
    properties: {
        gameId: { type: 'integer', minimum: 1, maximum: 2_147_483_647 },
    },
};

const userSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'username', 'photo'],
    properties: {
        id: { type: 'integer' },
        username: { type: ['string', 'null'] },
        photo: { type: ['string', 'null'] },
    },
};

const gameSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'title', 'cover'],
    properties: {
        id: { type: 'integer' },
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
        'version',
        'createdAt',
        'updatedAt',
        'user',
        'game',
    ],
    properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        gameId: { type: 'integer' },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        text: { type: ['string', 'null'] },
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        version: { type: 'integer', minimum: 1 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        user: userSchema,
        game: gameSchema,
    },
};

const reportSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'id',
        'reporterId',
        'reviewId',
        'reason',
        'reviewRating',
        'reviewText',
        'reviewCreatedAt',
        'reviewVersion',
        'status',
        'createdAt',
        'updatedAt',
    ],
    properties: {
        id: { type: 'integer' },
        reporterId: { type: 'integer' },
        reviewId: { type: 'integer' },
        reason: { type: 'string' },
        reviewRating: { type: 'integer', minimum: 1, maximum: 5 },
        reviewText: { type: ['string', 'null'] },
        reviewCreatedAt: { type: 'string', format: 'date-time' },
        reviewVersion: { type: 'integer', minimum: 1 },
        status: { type: 'string', enum: ['pending', 'resolved', 'rejected'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
};

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

export const createReviewSchemaSwagger = {
    schema: {
        tags: ['Reviews'],
        summary: 'Criar uma review para um jogo',
        security: [{ bearerAuth: [] }],
        params: gameIdParamsSchema,
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['rating'],
            properties: {
                rating: { type: 'integer', minimum: 1, maximum: 5 },
                text: { type: ['string', 'null'], maxLength: 250 },
            },
        },
        response: {
            201: reviewSchema,
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            409: errorSchema,
        },
    },
};

export const updateReviewSchemaSwagger = {
    schema: {
        tags: ['Reviews'],
        summary: 'Atualizar a própria review',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        body: {
            type: 'object',
            additionalProperties: false,
            minProperties: 1,
            properties: {
                rating: { type: 'integer', minimum: 1, maximum: 5 },
                text: { type: ['string', 'null'], maxLength: 250 },
            },
        },
        response: {
            200: reviewSchema,
            400: errorSchema,
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
        },
    },
};

export const deleteReviewSchemaSwagger = {
    schema: {
        tags: ['Reviews'],
        summary: 'Remover a própria review',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: {
            204: { type: 'null' },
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
        },
    },
};

export const reportReviewSchemaSwagger = {
    schema: {
        tags: ['Reviews'],
        summary: 'Denunciar uma review',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['reason'],
            properties: {
                reason: { type: 'string', minLength: 10, maxLength: 500 },
            },
        },
        response: {
            201: reportSchema,
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            409: errorSchema,
        },
    },
};
