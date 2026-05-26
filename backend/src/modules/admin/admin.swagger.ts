export const getUsersStatsSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Get users stats',
        security: [{ bearerAuth: [] }],
        response: {
            200: {
                type: 'object',
                properties: {
                    usersStatus: {
                        type: 'object',
                        nullable: true,
                        properties: {
                            totalUsers: { type: 'number' },
                            totalActive: { type: 'number' },
                            totalDeactivated: { type: 'number' },
                            totalAdmins: { type: 'number' },
                            totalRegularUsers: { type: 'number' },
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
        summary: 'Get all admin users',
        security: [{ bearerAuth: [] }],
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
                                name: { type: 'string' },
                                email: { type: 'string' },
                                photo: { type: 'string', nullable: true },
                                createdAt: { type: 'string', format: 'date-time' },
                                roleId: { type: 'number' },
                            },
                        },
                    },
                    nextCursor: { type: ['number', 'null'] },
                },
            },
        },
    },
};

export const searchUserAdminSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Search users by email',
        security: [{ bearerAuth: [] }],
        querystring: {
            type: 'object',
            properties: { email: { type: 'string' }, cursor: { type: 'string' } },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    users: { type: 'array', items: { type: 'object' } },
                    nextCursor: { type: ['number', 'null'] },
                },
            },
        },
    },
};

export const getUsersSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Get all users with pagination',
        security: [{ bearerAuth: [] }],
        querystring: {
            type: 'object',
            properties: { cursor: { type: 'string' }, limit: { type: 'number' } },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    users: { type: 'array', items: { type: 'object' } },
                    nextCursor: { type: ['number', 'null'] },
                },
            },
        },
    },
};

export const getDashboardSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Get dashboard metrics',
        security: [{ bearerAuth: [] }],
        response: {
            200: {
                type: 'object',
                properties: {
                    totalUsers: { type: 'number' },
                    totalReviews: { type: 'number' },
                    totalGames: { type: 'number' },
                    activeToday: { type: 'number' },
                    pendingReviews: { type: 'number' },
                    pendingReports: { type: 'number' },
                    topGames: { type: 'array', items: { type: 'object' } },
                    recentActivity: { type: 'array', items: { type: 'object' } },
                },
            },
        },
    },
};

export const getUserDetailSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Get user details',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'number' } } },
        response: {
            200: {
                type: 'object',
                properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    username: { type: 'string', nullable: true },
                    roleId: { type: 'number' },
                    activate: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    isBlocked: { type: 'boolean' },
                },
            },
        },
    },
};

export const blockUserSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Block user',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'number' } } },
        body: { type: 'object', properties: { reason: { type: 'string' } } },
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } } },
    },
};

export const unblockUserSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Unblock user',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'number' } } },
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } } },
    },
};

export const deleteUserAdminSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Delete user',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'number' } } },
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } } },
    },
};

export const getReviewsModerationSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Get reviews for moderation',
        security: [{ bearerAuth: [] }],
        querystring: {
            type: 'object',
            properties: { status: { type: 'string' }, cursor: { type: 'string' } },
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

export const deleteReviewAdminSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Delete review',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'number' } } },
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } } },
    },
};

export const getReportsSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Get reports',
        security: [{ bearerAuth: [] }],
        response: {
            200: {
                type: 'object',
                properties: { reports: { type: 'array', items: { type: 'object' } } },
            },
        },
    },
};

export const resolveReportSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Resolve report',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'number' } } },
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } } },
    },
};
