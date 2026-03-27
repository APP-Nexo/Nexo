export const healthSchemaSwagger = 
{
    schema: {
        tags: ['Health'],
        summary: 'Check if the API is online',
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    uptime:  { type: 'number' }
                }
            }
        }
    }
}

export const pingSchemaSwagger = 
{
    schema: {
        tags: ['Health'],
        summary: 'Ping',
        response: {
            200: {
                type: 'object',
                properties: {
                    message:   { type: 'string' },
                    timestamp: { type: 'string' }
                }
            }
        }
    }
}