import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './auth.errors.js';

const passwordSchema = {
    type: 'string',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
};

const tokenResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['tokenType', 'token', 'refreshToken', 'expiresIn'],
    properties: {
        tokenType: { type: 'string' },
        token: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'string' },
    },
};

const messageResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['message'],
    properties: { message: { type: 'string' } },
};

const errorResponseSchema = {
    type: 'object',
    required: ['code', 'message'],
    properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' },
    },
};

export const registerSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/register',
        security: [],
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['username', 'email', 'password', 'confirmPassword'],
            properties: {
                username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 30,
                    pattern: '^[A-Za-z0-9](?:[A-Za-z0-9_.-]*[A-Za-z0-9])?$',
                },
                email: { type: 'string', format: 'email', maxLength: 254 },
                password: passwordSchema,
                confirmPassword: passwordSchema,
            },
        },
        response: {
            201: tokenResponseSchema,
            400: errorResponseSchema,
            409: errorResponseSchema,
        },
    },
};

export const loginSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/login',
        security: [],
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['password'],
            anyOf: [{ required: ['identifier'] }, { required: ['email'] }],
            properties: {
                identifier: { type: 'string', minLength: 1, maxLength: 254 },
                email: { type: 'string', format: 'email', maxLength: 254 },
                password: passwordSchema,
            },
        },
        response: {
            200: tokenResponseSchema,
            400: errorResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
        },
    },
};

export const refreshSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/refresh',
        security: [],
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['refreshToken'],
            properties: {
                refreshToken: { type: 'string', minLength: 1, maxLength: 4096 },
            },
        },
        response: {
            200: tokenResponseSchema,
            400: errorResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
        },
    },
};

export const logoutSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/logout',
        security: [{ bearerAuth: [] }],
        body: {
            type: 'object',
            additionalProperties: false,
            properties: { allSessions: { type: 'boolean' } },
        },
        response: {
            200: messageResponseSchema,
            400: errorResponseSchema,
            401: errorResponseSchema,
        },
    },
};

export const forgotPasswordSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/forgot-password',
        security: [],
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['email'],
            properties: {
                email: { type: 'string', format: 'email', maxLength: 254 },
            },
        },
        response: {
            200: messageResponseSchema,
            400: errorResponseSchema,
        },
    },
};

export const resetPasswordSchemaSwagger = {
    schema: {
        tags: ['Auth'],
        summary: '/auth/reset-password',
        security: [],
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['token', 'password'],
            properties: {
                token: { type: 'string', minLength: 64, maxLength: 64 },
                password: passwordSchema,
            },
        },
        response: {
            200: messageResponseSchema,
            400: errorResponseSchema,
        },
    },
};
