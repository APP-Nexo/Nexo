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
                    users: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'number' },
                                friendlyId: { type: 'string', nullable: true },
                                name: { type: 'string' },
                                email: { type: 'string' },
                                photo: { type: 'string', nullable: true },
                                createdAt: { type: 'string', format: 'date-time' },
                                isFollowing: { type: 'boolean' },
                            },
                        },
                    },
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
                    user: {
                        type: 'object',
                        properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                            roleId: { type: 'number' },
                            isFollowing: { type: 'boolean' },
                        },
                    },
                    profile: {
                        type: 'object',
                        properties: {
                            friendlyId: { type: 'string' },
                            photo: { type: 'string', nullable: true },
                            banner: { type: 'string', nullable: true },
                            bio: { type: 'string', nullable: true },
                            config: { type: 'object', nullable: true },
                            followersCount: { type: 'number' },
                            followingCount: { type: 'number' },
                        },
                    },
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
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'number' },
                                name: { type: 'string' },
                                email: { type: 'string' },
                                friendlyId: { type: 'string', nullable: true },
                                photo: { type: 'string', nullable: true },
                                createdAt: { type: 'string', format: 'date-time' },
                                isFollowing: { type: 'boolean' },
                            },
                        },
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
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'number' },
                                name: { type: 'string' },
                                email: { type: 'string' },
                                friendlyId: { type: 'string', nullable: true },
                                photo: { type: 'string', nullable: true },
                                createdAt: { type: 'string', format: 'date-time' },
                                isFollowing: { type: 'boolean' },
                            },
                        },
                    },
                    nextCursor: { type: ['number', 'null'] },
                },
            },
        },
    },
};
