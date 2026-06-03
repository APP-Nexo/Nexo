export const healthSchemaSwagger = {
    schema: {
        tags: ['Health'],
        summary: '/verify/health',
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    uptime: { type: 'number' },
                },
            },
        },
    },
};

export const pingSchemaSwagger = {
    schema: {
        tags: ['Health'],
        summary: '/verify/ping',
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    timestamp: { type: 'string' },
                },
            },
        },
    },
};
