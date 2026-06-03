export const followUserSchemaSwagger = {
    schema: {
        tags: ['Social'],
        summary: '/social/:username/follow',
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
        summary: '/social/:username/follow',
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
        summary: '/social/:username/followers',
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
        summary: '/social/:username/following',
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
        summary: '/social/feed',
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
