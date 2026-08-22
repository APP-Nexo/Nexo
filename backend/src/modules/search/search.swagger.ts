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

const searchUserSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'username', 'photo', 'bio', 'followersCount'],
    properties: {
        id: { type: 'integer', minimum: 1 },
        username: { type: 'string' },
        photo: { type: ['string', 'null'] },
        bio: { type: ['string', 'null'] },
        followersCount: { type: 'integer', minimum: 0 },
    },
};

export const searchUsersSchemaSwagger = {
    schema: {
        tags: ['Search'],
        summary: '/search/users',
        security: [],
        querystring: {
            type: 'object',
            additionalProperties: false,
            properties: {
                q: { type: 'string', maxLength: 100 },
                cursor: { type: 'integer', minimum: 1, maximum: 2_147_483_647 },
                limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
                suggested: { type: 'boolean', default: false },
            },
            anyOf: [
                {
                    required: ['q'],
                    properties: { q: { type: 'string', minLength: 2, pattern: '\\S' } },
                },
                {
                    required: ['suggested'],
                    properties: {
                        suggested: { type: 'boolean', const: true },
                        q: { type: 'string', maxLength: 0 },
                    },
                },
            ],
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['data', 'total', 'hasMore', 'nextCursor'],
                properties: {
                    data: { type: 'array', items: searchUserSchema },
                    total: { type: 'integer', minimum: 0 },
                    hasMore: { type: 'boolean' },
                    nextCursor: { type: ['string', 'null'] },
                },
            },
            400: errorSchema,
        },
    },
};
