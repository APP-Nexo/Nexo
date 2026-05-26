export const followUserSchemaSwagger = {
    schema: {
        tags: ['Follow'],
        summary: 'Follow user',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string' },
            },
        },
        response: {
            201: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                },
            },
        },
    },
};

export const unfollowUserSchemaSwagger = {
    schema: {
        tags: ['Follow'],
        summary: 'Unfollow user',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string' },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                },
            },
        },
    },
};
