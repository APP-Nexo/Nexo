import { PRISMA_INT_MAX } from '../../shared/infrastructure/validation/prisma-values.js';

const idParamsSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: { id: { type: 'integer', minimum: 1, maximum: PRISMA_INT_MAX } },
};

const roleActionResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['message', 'email', 'role'],
    properties: {
        message: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['admin', 'user'] },
    },
};

export const promoteUserSchemaSwagger = {
    schema: {
        tags: ['Master'],
        summary: '/master/user/:id/promote',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: { 200: roleActionResponseSchema },
    },
};

export const demoteUserSchemaSwagger = {
    schema: {
        tags: ['Master'],
        summary: '/master/user/:id/demote',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: { 200: roleActionResponseSchema },
    },
};

export const banUserSchemaSwagger = {
    schema: {
        tags: ['Master'],
        summary: '/master/user/:id/ban',
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                required: ['message', 'email', 'bannedAt'],
                properties: {
                    message: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    bannedAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
};
