export const updateUserSchemaSwagger = {
    schema: {
        tags: ['User'],
    },
};

export const searchUserSchemaSwagger = {
    schema: {
        tags: ['User'],
        summary: 'Search users by name or friendlyId',
        security: [{ bearerAuth: [] }],
        querystring: {
            type: 'object',
            properties: {
                find: { type: 'string' },
                cursor: { type: 'string' },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    users: { type: 'array', additionalProperties: true },
                    nextCursor: { type: 'number', nullable: true },
                    total: { type: 'number' },
                },
            },
        },
    },
};

export const getUserSchemaSwagger = {
    schema: {
        tags: ['User'],
        summary: 'Get user by id',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            properties: {
                id: { type: 'number' },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    user: { type: 'object', additionalProperties: true },
                    profile: { type: 'object', additionalProperties: true },
                },
            },
        },
    },
};

export const deleteUserSchemaSwagger = {
    schema: {
        tags: ['User'],
        summary: 'Soft delete account',
        security: [{ bearerAuth: [] }],
        body: {
            type: 'object',
            required: ['email'],
            properties: {
                email: { type: 'string' },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    deletedAt: { type: 'string' },
                    email: { type: 'string' },
                },
            },
        },
    },
};

export const getFollowersSchemaSwagger = {
    schema: {
        tags: ['User'],
        summary: 'Get user followers',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            properties: {
                id: { type: 'number' },
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
                    followers: {
                        type: 'array',
                        items: { type: 'object', additionalProperties: true },
                    },
                    nextCursor: { type: ['number', 'null'] },
                },
            },
        },
    },
};

export const getFollowingsSchemaSwagger = {
    schema: {
        tags: ['User'],
        summary: 'Get user followings',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            properties: {
                id: { type: 'number' },
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
                    followings: {
                        type: 'array',
                        items: { type: 'object', additionalProperties: true },
                    },
                    nextCursor: { type: ['number', 'null'] },
                },
            },
        },
    },
};
