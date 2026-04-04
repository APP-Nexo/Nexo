export const getNotificationsSchemaSwagger = {
    schema: {
        tags: ['Notification'],
        summary: 'Get notifications',
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
                    notifications: { type: 'array' },
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
