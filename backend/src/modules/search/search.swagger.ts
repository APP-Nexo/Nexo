export const searchUsersSchemaSwagger = {
    schema: {
        tags: ['Search'],
        summary: 'Search users by name or username',
        querystring: {
            type: 'object',
            required: ['q'],
            properties: {
                q: { type: 'string' },
                cursor: { type: 'string' },
                limit: { type: 'number' },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'number' },
                                name: { type: 'string' },
                                username: { type: 'string', nullable: true },
                                photo: { type: 'string', nullable: true },
                                bio: { type: 'string', nullable: true },
                                followersCount: { type: 'number' },
                            },
                        },
                    },
                    total: { type: 'number' },
                },
            },
        },
    },
};
