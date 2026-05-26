export const registerSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: 'Register',
        body: {
            type: 'object',
            properties: {
                name: { type: 'string' },
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
        summary: 'Login',
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
        summary: 'Refresh token',
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
        summary: 'Logout',
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
        summary: 'Forgot password',
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
                },
            },
        },
    },
};

export const resetPasswordSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: 'Reset password',
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

