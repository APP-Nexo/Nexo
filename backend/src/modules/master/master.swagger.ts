export const promoteUserSchemaSwagger = {
    schema: {
        tags: ['Master'],
        summary: '/master/user/:id/promote',
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
                    message: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                },
            },
        },
    },
};

export const demoteUserSchemaSwagger = {
    schema: {
        tags: ['Master'],
        summary: '/master/user/:id/demote',
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
                    message: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                },
            },
        },
    },
};

export const banUserSchemaSwagger = {
    schema: {
        tags: ['Master'],
        summary: '/master/user/:id/ban',
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
                    message: { type: 'string' },
                    email: { type: 'string' },
                    bannedAt: { type: 'string' },
                },
            },
        },
    },
};
