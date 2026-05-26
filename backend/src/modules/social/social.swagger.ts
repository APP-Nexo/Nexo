export const followUserSchemaSwagger = {
    schema: {
        tags: ['Social'],
        summary: 'Follow user',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            properties: {
                username: { type: 'string' },
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
        tags: ['Social'],
        summary: 'Unfollow user',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            properties: {
                username: { type: 'string' },
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

export const getFollowersSchemaSwagger = {
    schema: {
        tags: ['Social'],
        summary: 'Get followers',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            properties: {
                username: { type: 'string' },
            },
        },
        querystring: {
            type: 'object',
            properties: {
                cursor: { type: 'string' },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    followers: { type: 'array', items: { type: 'object' } },
                    nextCursor: { type: ['number', 'null'] },
                },
            },
        },
    },
};

export const getFollowingSchemaSwagger = {
    schema: {
        tags: ['Social'],
        summary: 'Get following',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            properties: {
                username: { type: 'string' },
            },
        },
        querystring: {
            type: 'object',
            properties: {
                cursor: { type: 'string' },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    following: { type: 'array', items: { type: 'object' } },
                    nextCursor: { type: ['number', 'null'] },
                },
            },
        },
    },
};

export const getFeedSchemaSwagger = {
    schema: {
        tags: ['Social'],
        summary: 'Get social feed',
        security: [{ bearerAuth: [] }],
        response: {
            200: {
                type: 'object',
                properties: {
                    feed: { type: 'array', items: { type: 'object' } },
                    nextCursor: { type: ['number', 'null'] },
                },
            },
        },
    },
};
