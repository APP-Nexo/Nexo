export const updateUserSchemaSwagger = 
{
    schema: {
        tags: ['User']
    }
}


export const searchUserSchemaSwagger = 
{
    schema: {
        tags: ['User'],
        summary: 'Search users by name or friendlyId',
        security: [{ bearerAuth: [] }],
        querystring: {
        type: 'object',
        properties: {
            search: { type: 'string' },
            cursor: { type: 'string' }
        }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    users:      { type: 'array', additionalProperties: true },
                    nextCursor: { type: 'number', nullable: true },
                    total:      { type: 'number' }
                }
            }
        }
    }
}

export const getUserSchemaSwagger = 
{
    schema: {
        tags: ['User'],
        summary: 'Get user by id',
        security: [{ bearerAuth: [] }],
        params: {
        type: 'object',
        properties: {
            id: { type: 'number' }
        }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    user:    { type: 'object', additionalProperties: true },
                    profile: { type: 'object', additionalProperties: true }
                }
            }
        }
    }
}

export const deleteUserSchemaSwagger = 
{
    schema: {
        tags: ['User'],
        summary: 'Soft delete account',
        security: [{ bearerAuth: [] }],
        body: {
        type: 'object',
        required: ['email'],
        properties: {
            email: { type: 'string' }
        }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    message:   { type: 'string' },
                    deletedAt: { type: 'string' },
                    email:     { type: 'string' }
                }
            }
        }
    }
}