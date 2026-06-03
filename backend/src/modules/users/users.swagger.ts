export const getUserProfileSchemaSwagger = {
    schema: {
        tags: ['Users'],
        summary: '/users/:username',
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
                    id: { type: 'number' },
                    username: { type: 'string', nullable: true },
                    bio: { type: 'string', nullable: true },
                    photo: { type: 'string', nullable: true },
                    banner: { type: 'string', nullable: true },
                    followersCount: { type: 'number' },
                    followingCount: { type: 'number' },
                    createdAt: { type: 'string', format: 'date-time' },
                    isFollowing: { type: 'boolean' },
                },
            },
        },
    },
};

export const getUserReviewsSchemaSwagger = {
    schema: {
        tags: ['Users'],
        summary: '/users/:username/reviews',
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
                    reviews: { type: 'array', items: { type: 'object' } },
                    nextCursor: { type: ['number', 'null'] },
                },
            },
        },
    },
};

export const getUserStatsSchemaSwagger = {
    schema: {
        tags: ['Users'],
        summary: '/users/:username/stats',
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
                    totalReviews: { type: 'number' },
                    averageRating: { type: 'number', nullable: true },
                    totalGames: { type: 'number' },
                    followersCount: { type: 'number' },
                    followingCount: { type: 'number' },
                    memberSince: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
};

export const getUserListsSchemaSwagger = {
    schema: {
        tags: ['Users'],
        summary: '/users/:username/lists',
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
                    lists: { type: 'array', items: { type: 'object' } },
                },
            },
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
            properties: {
                friendlyId: { type: 'string' },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    id: { type: 'number' },
                    username: { type: 'string', nullable: true },
                    bio: { type: 'string', nullable: true },
                    photo: { type: 'string', nullable: true },
                    banner: { type: 'string', nullable: true },
                    followersCount: { type: 'number' },
                    followingCount: { type: 'number' },
                    createdAt: { type: 'string', format: 'date-time' },
                    isFollowing: { type: 'boolean' },
                },
            },
        },
    },
};
