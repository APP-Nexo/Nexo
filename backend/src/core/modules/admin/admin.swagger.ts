export const getUsersStatsSchemaSwagger = 
{
    schema: {
        tags: ['Admin'],
        summary: 'Get users stats',
        security: [{ bearerAuth: [] }],
        response: {
            200: {
                type: 'object',
                    properties: {
                    usersStatus: { type: 'object', additionalProperties: true }
                }
            }
        }
    }
}

export const getUsersAdminSchemaSwagger = 
{
    schema: {
        tags: ['Admin'],
        summary: 'Get all admin users',
        security: [{ bearerAuth: [] }],
        response: {
            200: {
                type: 'object',
                properties: {
                    users: {
                        type: 'array',
                        items: { type: 'object', additionalProperties: true }
                    }
                }
            }
        }
    }
}

export const searchUserAdminSchemaSwagger = 
{
    schema: {
        tags: ['Admin'],
        summary: 'Search users by email',
        security: [{ bearerAuth: [] }],
        querystring: {
        type: 'object',
        properties: {
            email:  { type: 'string' },
            cursor: { type: 'string' }
        }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    users: {
                        type: 'array',
                        items: { type: 'object', additionalProperties: true }
                    },
                    nextCursor: { type: ['number', 'null'] }
                }
            }
        }
    }
}

export const getUsersSchemaSwagger = 
{
    schema: {
        tags: ['Admin'],
        summary: 'Get all users with pagination',
        security: [{ bearerAuth: [] }],
        querystring: {
        type: 'object',
        properties: {
            cursor: { type: 'string' },
            limit:  { type: 'number' }
        }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    users: {
                        type: 'array',
                        items: { type: 'object', additionalProperties: true }
                    },
                    nextCursor: { type: ['number', 'null'] }
                }
            }
        }
    }
}