import { PRISMA_INT_MAX } from '../../shared/infrastructure/validation/prisma-values.js';

const errorSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['code', 'message', 'requestId'],
    properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' },
    },
};

const messageSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['message'],
    properties: { message: { type: 'string' } },
};

const idParamsSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: { id: { type: 'integer', minimum: 1, maximum: PRISMA_INT_MAX } },
};

const notificationUserSchema = {
    type: ['object', 'null'],
    additionalProperties: false,
    required: ['id', 'username', 'photo'],
    properties: {
        id: { type: 'integer', minimum: 1 },
        username: { type: 'string' },
        photo: { type: ['string', 'null'] },
    },
};

const notificationSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'id',
        'type',
        'read',
        'readAt',
        'entityType',
        'entityId',
        'metadata',
        'createdAt',
        'toUserId',
        'fromUserId',
        'fromUser',
    ],
    properties: {
        id: { type: 'integer', minimum: 1 },
        type: {
            type: 'string',
            enum: ['follow', 'review', 'report', 'moderation', 'system'],
        },
        read: { type: 'boolean' },
        readAt: { type: ['string', 'null'], format: 'date-time' },
        entityType: { type: ['string', 'null'] },
        entityId: { type: ['integer', 'null'], minimum: 1 },
        metadata: {},
        createdAt: { type: 'string', format: 'date-time' },
        toUserId: { type: 'integer', minimum: 1 },
        fromUserId: { type: ['integer', 'null'], minimum: 1 },
        fromUser: notificationUserSchema,
    },
};

export const getNotificationsSchemaSwagger = {
    schema: {
        tags: ['Notification'],
        summary: '/notification',
        security: [{ bearerAuth: [] }],
        querystring: {
            type: 'object',
            additionalProperties: false,
            properties: {
                cursor: { type: 'integer', minimum: 1, maximum: PRISMA_INT_MAX },
            },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['notifications', 'nextCursor', 'total', 'unreadCount'],
                properties: {
                    notifications: { type: 'array', items: notificationSchema },
                    nextCursor: { type: ['integer', 'null'], minimum: 1 },
                    total: { type: 'integer', minimum: 0 },
                    unreadCount: { type: 'integer', minimum: 0 },
                },
            },
            400: errorSchema,
            401: errorSchema,
        },
    },
};

export const readAllNotificationsSchemaSwagger = {
    schema: {
        tags: ['Notification'],
        summary: '/notification/read-all',
        security: [{ bearerAuth: [] }],
        response: { 200: messageSchema, 401: errorSchema },
    },
};

export const readNotificationSchemaSwagger = {
    schema: {
        tags: ['Notification'],
        summary: '/notification/:id/read',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: {
            200: messageSchema,
            401: errorSchema,
            404: errorSchema,
        },
    },
};

export const deleteNotificationSchemaSwagger = {
    schema: {
        tags: ['Notification'],
        summary: '/notification/delete/:id',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: {
            200: messageSchema,
            401: errorSchema,
            404: errorSchema,
        },
    },
};

export const deleteAllNotificationsSchemaSwagger = {
    schema: {
        tags: ['Notification'],
        summary: '/notification/delete-all',
        security: [{ bearerAuth: [] }],
        response: { 200: messageSchema, 401: errorSchema },
    },
};
