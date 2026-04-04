export const registerSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: 'Register',
        body: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                password: { type: 'string' },
                confirmPassword: { type: 'string' },
            },
        },
        response: {
            201: {
                type: 'object',
                properties: {
                    tokenType: { type: 'string' },
                    token: { type: 'string' },
                    expiresIn: { type: 'string' },
                },
            },
        },
    },
};

export const loginSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: 'Login',
        body: {
            type: 'object',
            properties: {
                email: { type: 'string' },
                password: { type: 'string' },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    tokenType: { type: 'string' },
                    token: { type: 'string' },
                    expiresIn: { type: 'string' },
                },
            },
        },
    },
};
