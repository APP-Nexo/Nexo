export const getNotificationsSchemaSwagger = {
    schema: {
        tags: ['Notification'],
        summary: 'Get notifications',
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
                                        name: { type: 'string' },
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
        summary: 'Read all notifications',
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
        summary: 'Delete notification',
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
        summary: 'Delete all notifications',
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
