export const registerSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/register',
        body: {
            type: 'object',
            properties: {
                username: { type: 'string' },
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
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'string' },
                },
            },
        },
    },
};

export const loginSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/login',
        body: {
            type: 'object',
            properties: {
                email: { type: 'string' },
                password: { type: 'string' },
            },
        },
        response: {
            201: {
                type: 'object',
                properties: {
                    tokenType: { type: 'string' },
                    token: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'string' },
                },
            },
        },
    },
};

export const refreshSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/refresh',
        body: {
            type: 'object',
            properties: {
                refreshToken: { type: 'string' },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    tokenType: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'string' },
                },
            },
        },
    },
};

export const logoutSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/logout',
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

export const forgotPasswordSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/forgot-password',
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
                    token: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
};

export const resetPasswordSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/reset-password',
        body: {
            type: 'object',
            properties: {
                token: { type: 'string' },
                password: { type: 'string' },
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
