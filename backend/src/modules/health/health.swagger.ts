export const healthSchemaSwagger = {
    schema: {
        tags: ['Health'],
        summary: '/verify/health',
        security: [],
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

export const readySchemaSwagger = {
    schema: {
        tags: ['Health'],
        summary: '/verify/ready',
        security: [],
        response: {
            200: {
                type: 'object',
                required: ['message', 'database', 'uptime'],
                properties: {
                    message: { type: 'string' },
                    database: { type: 'string' },
                    uptime: { type: 'number' },
                },
            },
            503: {
                type: 'object',
                required: ['code', 'message', 'requestId'],
                properties: {
                    code: { type: 'string' },
                    message: { type: 'string' },
                    requestId: { type: 'string' },
                },
            },
        },
    },
};

export const pingSchemaSwagger = {
    schema: {
        tags: ['Health'],
        summary: '/verify/ping',
        security: [],
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
