const PRISMA_INT_MAX = 2_147_483_647;

const idParamsSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: { id: { type: 'integer', minimum: 1, maximum: PRISMA_INT_MAX } },
};

const cursorSchema = {
    type: ['integer', 'null'],
    minimum: 1,
    maximum: PRISMA_INT_MAX,
};

const paginationQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        cursor: { type: 'integer', minimum: 1, maximum: PRISMA_INT_MAX },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
    },
};

const roleSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'role'],
    properties: {
        id: { type: 'integer' },
        role: { type: 'string' },
    },
};

const profileSchema = {
    type: ['object', 'null'],
    additionalProperties: false,
    required: [
        'id',
        'friendlyId',
        'photo',
        'banner',
        'config',
        'bio',
        'followersCount',
        'followingCount',
    ],
    properties: {
        id: { type: 'integer' },
        friendlyId: { type: 'string' },
        photo: { type: ['string', 'null'] },
        banner: { type: ['string', 'null'] },
        config: {},
        bio: { type: ['string', 'null'] },
        followersCount: { type: 'integer' },
        followingCount: { type: 'integer' },
    },
};

const blockedUserSchema = {
    type: ['object', 'null'],
    additionalProperties: false,
    required: ['id', 'blockedById', 'reason', 'createdAt'],
    properties: {
        id: { type: 'integer' },
        blockedById: { type: 'integer' },
        reason: { type: ['string', 'null'] },
        createdAt: { type: 'string', format: 'date-time' },
    },
};

const adminUserSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'id',
        'username',
        'email',
        'createdAt',
        'updatedAt',
        'deletedAt',
        'activate',
        'role',
        'profile',
        'blockedUser',
    ],
    properties: {
        id: { type: 'integer' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        deletedAt: { type: ['string', 'null'], format: 'date-time' },
        activate: { type: 'boolean' },
        role: roleSchema,
        profile: profileSchema,
        blockedUser: blockedUserSchema,
    },
};

const userSummarySchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'username', 'email', 'profile'],
    properties: {
        id: { type: 'integer' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        profile: {
            type: ['object', 'null'],
            additionalProperties: false,
            required: ['photo'],
            properties: { photo: { type: ['string', 'null'] } },
        },
    },
};

const gameSummarySchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'title', 'cover'],
    properties: {
        id: { type: 'integer' },
        title: { type: 'string' },
        cover: { type: ['string', 'null'] },
    },
};

const moderationReviewSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'id',
        'userId',
        'gameId',
        'rating',
        'text',
        'status',
        'moderationReason',
        'createdAt',
        'updatedAt',
        'user',
        'game',
        '_count',
    ],
    properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        gameId: { type: 'integer' },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        text: { type: ['string', 'null'] },
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        moderationReason: { type: ['string', 'null'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        user: userSummarySchema,
        game: gameSummarySchema,
        _count: {
            type: 'object',
            additionalProperties: false,
            required: ['reports'],
            properties: { reports: { type: 'integer', minimum: 0 } },
        },
    },
};

const reportReviewSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'id',
        'userId',
        'gameId',
        'rating',
        'text',
        'status',
        'moderationReason',
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
        moderationReason: { type: ['string', 'null'] },
        user: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'username'],
            properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
            },
        },
        game: gameSummarySchema,
    },
};

const resolverSchema = {
    type: ['object', 'null'],
    additionalProperties: false,
    required: ['id', 'username', 'email'],
    properties: {
        id: { type: 'integer' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
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
        'resolvedById',
        'resolutionReason',
        'resolvedAt',
        'createdAt',
        'updatedAt',
        'reporter',
        'review',
        'resolvedBy',
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
        resolvedById: { type: ['integer', 'null'] },
        resolutionReason: { type: ['string', 'null'] },
        resolvedAt: { type: ['string', 'null'], format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        reporter: userSummarySchema,
        review: reportReviewSchema,
        resolvedBy: resolverSchema,
    },
};

const messageResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['message'],
    properties: { message: { type: 'string' } },
};

const reportsResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['reports', 'nextCursor'],
    properties: {
        reports: { type: 'array', items: reportSchema },
        nextCursor: cursorSchema,
    },
};

const reportResolutionResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['message', 'report'],
    properties: { message: { type: 'string' }, report: reportSchema },
};

export const getUsersStatsSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/user/stats',
        security: [{ bearerAuth: [] }],
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['usersStatus'],
                properties: {
                    usersStatus: {
                        type: 'object',
                        additionalProperties: false,
                        required: [
                            'totalUsers',
                            'totalActive',
                            'totalDeactivated',
                            'totalAdmins',
                            'totalRegularUsers',
                        ],
                        properties: {
                            totalUsers: { type: 'integer', minimum: 0 },
                            totalActive: { type: 'integer', minimum: 0 },
                            totalDeactivated: { type: 'integer', minimum: 0 },
                            totalAdmins: { type: 'integer', minimum: 0 },
                            totalRegularUsers: { type: 'integer', minimum: 0 },
                        },
                    },
                },
            },
        },
    },
};

export const getUsersAdminSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/user/admin',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema,
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['users', 'nextCursor'],
                properties: {
                    users: { type: 'array', items: adminUserSchema },
                    nextCursor: cursorSchema,
                },
            },
        },
    },
};

export const searchUserAdminSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/user/search',
        security: [{ bearerAuth: [] }],
        querystring: {
            type: 'object',
            additionalProperties: false,
            required: ['q'],
            properties: {
                q: { type: 'string', minLength: 1, maxLength: 255 },
                cursor: { type: 'integer', minimum: 1, maximum: PRISMA_INT_MAX },
            },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['users', 'nextCursor'],
                properties: {
                    users: { type: 'array', items: adminUserSchema },
                    nextCursor: cursorSchema,
                },
            },
        },
    },
};

export const getUsersSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/user-all',
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema,
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['users', 'nextCursor'],
                properties: {
                    users: { type: 'array', items: adminUserSchema },
                    nextCursor: cursorSchema,
                },
            },
        },
    },
};

export const getDashboardSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/dashboard',
        security: [{ bearerAuth: [] }],
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: [
                    'totalUsers',
                    'totalReviews',
                    'totalGames',
                    'activeToday',
                    'pendingReviews',
                    'pendingReports',
                    'topGames',
                    'recentActivity',
                ],
                properties: {
                    totalUsers: { type: 'integer', minimum: 0 },
                    totalReviews: { type: 'integer', minimum: 0 },
                    totalGames: { type: 'integer', minimum: 0 },
                    activeToday: { type: 'integer', minimum: 0 },
                    pendingReviews: { type: 'integer', minimum: 0 },
                    pendingReports: { type: 'integer', minimum: 0 },
                    topGames: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            required: ['id', 'title', 'cover', 'reviewCount'],
                            properties: {
                                id: { type: 'integer' },
                                title: { type: 'string' },
                                cover: { type: ['string', 'null'] },
                                reviewCount: { type: 'integer', minimum: 0 },
                            },
                        },
                    },
                    recentActivity: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            required: ['date', 'newUsers', 'newReviews'],
                            properties: {
                                date: { type: 'string' },
                                newUsers: { type: 'integer', minimum: 0 },
                                newReviews: { type: 'integer', minimum: 0 },
                            },
                        },
                    },
                },
            },
        },
    },
};

export const getUserDetailSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/users/:id',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: {
            200: {
                ...adminUserSchema,
                required: [...adminUserSchema.required, 'isBlocked', 'reviews'],
                properties: {
                    ...adminUserSchema.properties,
                    isBlocked: { type: 'boolean' },
                    reviews: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            required: [
                                'id',
                                'gameId',
                                'rating',
                                'text',
                                'status',
                                'moderationReason',
                                'createdAt',
                                'updatedAt',
                                'game',
                            ],
                            properties: {
                                id: { type: 'integer' },
                                gameId: { type: 'integer' },
                                rating: { type: 'integer', minimum: 1, maximum: 5 },
                                text: { type: ['string', 'null'] },
                                status: {
                                    type: 'string',
                                    enum: ['pending', 'approved', 'rejected'],
                                },
                                moderationReason: { type: ['string', 'null'] },
                                createdAt: { type: 'string', format: 'date-time' },
                                updatedAt: { type: 'string', format: 'date-time' },
                                game: gameSummarySchema,
                            },
                        },
                    },
                },
            },
        },
    },
};

export const blockUserSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/users/:id/block',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        body: {
            type: 'object',
            additionalProperties: false,
            properties: { reason: { type: 'string', minLength: 1, maxLength: 500 } },
        },
        response: { 200: messageResponseSchema },
    },
};

export const unblockUserSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/users/:id/block',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: { 200: messageResponseSchema },
    },
};

export const deleteUserAdminSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/users/:id',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: { 200: messageResponseSchema },
    },
};

export const getReviewsModerationSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/reviews',
        security: [{ bearerAuth: [] }],
        querystring: {
            ...paginationQuerySchema,
            properties: {
                ...paginationQuerySchema.properties,
                status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['reviews', 'nextCursor'],
                properties: {
                    reviews: { type: 'array', items: moderationReviewSchema },
                    nextCursor: cursorSchema,
                },
            },
        },
    },
};

export const moderateReviewSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/reviews/:id/moderation',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['action'],
            properties: {
                action: { type: 'string', enum: ['approve', 'reject'] },
                reason: { type: 'string', minLength: 1, maxLength: 500 },
            },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['message', 'review'],
                properties: { message: { type: 'string' }, review: moderationReviewSchema },
            },
        },
    },
};

export const deleteReviewAdminSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/reviews/:id',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: { 200: messageResponseSchema },
    },
};

export const getReportsSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/reports',
        security: [{ bearerAuth: [] }],
        querystring: {
            ...paginationQuerySchema,
            properties: {
                ...paginationQuerySchema.properties,
                status: { type: 'string', enum: ['pending', 'resolved', 'rejected'] },
            },
        },
        response: { 200: reportsResponseSchema },
    },
};

export const updateReportSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/reports/:id',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['status'],
            properties: {
                status: { type: 'string', enum: ['resolved', 'rejected'] },
                action: { type: 'string', enum: ['reject_review'] },
                reason: { type: 'string', minLength: 1, maxLength: 500 },
            },
        },
        response: { 200: reportResolutionResponseSchema },
    },
};

export const resolveReportSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: '/admin/reports/:id/resolve',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: { 200: reportResolutionResponseSchema },
    },
};
