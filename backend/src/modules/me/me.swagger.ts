export const getMeSchemaSwagger = {
    schema: {
        tags: ['Me'],
        summary: 'Get own profile',
        security: [{ bearerAuth: [] }],
        response: {
            200: {
                type: 'object',
                properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    username: { type: 'string', nullable: true },
                    email: { type: 'string' },
                    roleId: { type: 'number' },
                    createdAt: { type: 'string', format: 'date-time' },
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

export const updateMeSchemaSwagger = {
    schema: {
        tags: ['Me'],
        summary: 'Update own profile',
        security: [{ bearerAuth: [] }],
        body: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                username: { type: 'string' },
                bio: { type: 'string' },
                photo: { type: 'string' },
                banner: { type: 'string' },
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

export const changePasswordSchemaSwagger = {
    schema: {
        tags: ['Me'],
        summary: 'Change password',
        security: [{ bearerAuth: [] }],
        body: {
            type: 'object',
            properties: {
                currentPassword: { type: 'string' },
                newPassword: { type: 'string' },
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

export const deleteMeSchemaSwagger = {
    schema: {
        tags: ['Me'],
        summary: 'Delete own account',
        security: [{ bearerAuth: [] }],
        body: {
            type: 'object',
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
                },
            },
        },
    },
};
