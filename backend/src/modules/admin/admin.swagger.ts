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
            properties: {
                email: { type: 'string' },
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

export const getUsersSchemaSwagger = {
    schema: {
        tags: ['Admin'],
        summary: 'Get all users with pagination',
        security: [{ bearerAuth: [] }],
        querystring: {
            type: 'object',
            properties: {
                cursor: { type: 'string' },
                limit: { type: 'number' },
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
                                name: { type: 'string' },
                                email: { type: 'string' },
                                photo: { type: 'string', nullable: true },
                                createdAt: { type: 'string', format: 'date-time' },
                                friendlyId: { type: 'string', nullable: true },
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
