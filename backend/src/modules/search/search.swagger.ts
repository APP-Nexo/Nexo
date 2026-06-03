export const searchUsersSchemaSwagger = {
    schema: {
        tags: ['Search'],
        summary: '/search/users',
        querystring: {
            type: 'object',
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
                                username: { type: 'string', nullable: true },
                                photo: { type: 'string', nullable: true },
                                bio: { type: 'string', nullable: true },
                                followersCount: { type: 'number' },
                            },
                        },
                    },
                    total: { type: 'number' },
                    nextCursor: { type: 'string', nullable: true },
                },
            },
        },
    },
};
