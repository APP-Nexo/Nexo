import {
    BIO_MAX_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from './me.interfaces.js';

const usernameSchema = {
    type: 'string',
    minLength: USERNAME_MIN_LENGTH,
    maxLength: USERNAME_MAX_LENGTH,
    pattern: '\\S',
};

const errorResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['code', 'message'],
    properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' },
    },
};

const profileSchema = {
    type: ['object', 'null'],
    additionalProperties: false,
    required: [
        'friendlyId',
        'photo',
        'banner',
        'bio',
        'config',
        'followersCount',
        'followingCount',
    ],
    properties: {
        friendlyId: { type: 'string' },
        photo: { type: ['string', 'null'] },
        banner: { type: ['string', 'null'] },
        bio: { type: ['string', 'null'] },
        config: { type: ['object', 'null'], additionalProperties: true },
        followersCount: { type: 'number' },
        followingCount: { type: 'number' },
    },
};

const meResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'username', 'email', 'roleId', 'createdAt', 'profile'],
    properties: {
        id: { type: 'number' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        roleId: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        profile: profileSchema,
    },
};

const messageResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['message'],
    properties: { message: { type: 'string' } },
};

export const getMeSchemaSwagger = {
    schema: {
        tags: ['Me'],
        summary: '/me',
        security: [{ bearerAuth: [] }],
        response: {
            200: meResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
            404: errorResponseSchema,
        },
    },
};

export const updateMeSchemaSwagger = {
    schema: {
        tags: ['Me'],
        summary: '/me',
        description:
            'Accepts application/json or multipart/form-data with only photo, banner, username and bio.',
        security: [{ bearerAuth: [] }],
        consumes: ['application/json', 'multipart/form-data'],
        body: {
            type: 'object',
            additionalProperties: false,
            minProperties: 1,
            maxProperties: 4,
            properties: {
                username: usernameSchema,
                bio: { type: 'string', maxLength: BIO_MAX_LENGTH },
                photo: { type: 'string', contentEncoding: 'binary' },
                banner: { type: 'string', contentEncoding: 'binary' },
            },
        },
        response: {
            200: meResponseSchema,
            400: errorResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
            404: errorResponseSchema,
            409: errorResponseSchema,
            413: errorResponseSchema,
            415: errorResponseSchema,
        },
    },
};

export const changePasswordSchemaSwagger = {
    schema: {
        tags: ['Me'],
        summary: '/me/password',
        security: [{ bearerAuth: [] }],
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['currentPassword', 'newPassword'],
            properties: {
                currentPassword: {
                    type: 'string',
                    minLength: PASSWORD_MIN_LENGTH,
                    maxLength: PASSWORD_MAX_LENGTH,
                },
                newPassword: {
                    type: 'string',
                    minLength: PASSWORD_MIN_LENGTH,
                    maxLength: PASSWORD_MAX_LENGTH,
                },
            },
        },
        response: {
            200: messageResponseSchema,
            400: errorResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
            404: errorResponseSchema,
        },
    },
};

export const deleteMeSchemaSwagger = {
    schema: {
        tags: ['Me'],
        summary: '/me',
        security: [{ bearerAuth: [] }],
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['password'],
            properties: {
                password: {
                    type: 'string',
                    minLength: PASSWORD_MIN_LENGTH,
                    maxLength: PASSWORD_MAX_LENGTH,
                },
            },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['message', 'deletedAt'],
                properties: {
                    message: { type: 'string' },
                    deletedAt: { type: 'string', format: 'date-time' },
                },
            },
            400: errorResponseSchema,
            403: errorResponseSchema,
            404: errorResponseSchema,
        },
    },
};
