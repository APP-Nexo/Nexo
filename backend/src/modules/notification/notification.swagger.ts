export const getNotificationsSchemaSwagger = {
    schema: {
        tags: ['Notification'],
        summary: '/notification',
        security: [{ bearerAuth: [] }],
        querystring: {
            type: 'object',
            properties: {
                cursor: { type: 'string' },
            },
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    notifications: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'number' },
                                toUserId: { type: 'number' },
                                createdAt: { type: 'string', format: 'date-time' },
                                read: { type: 'boolean' },
                                fromUser: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'number' },
                                        username: { type: 'string', nullable: true },
                                    },
                                },
                            },
                        },
                    },
                    nextCursor: { type: ['number', 'null'] },
                    total: { type: 'number' },
                },
            },
        },
    },
};

export const readAllNotificationsSchemaSwagger = {
    schema: {
        tags: ['Notification'],
        summary: '/notification/read-all',
        security: [{ bearerAuth: [] }],
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

export const deleteNotificationSchemaSwagger = {
    schema: {
        tags: ['Notification'],
        summary: '/notification/delete/:id',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string' },
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

export const deleteAllNotificationsSchemaSwagger = {
    schema: {
        tags: ['Notification'],
        summary: '/notification/delete-all',
        security: [{ bearerAuth: [] }],
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
