import type { NotificationType, Prisma } from '../../generated/client.js';

export type NotificationUser = {
    id: number;
    username: string;
    photo: string | null;
};

export type Notification = {
    id: number;
    type: NotificationType;
    read: boolean;
    readAt: Date | null;
    entityType: string | null;
    entityId: number | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    toUserId: number;
    fromUserId: number | null;
    fromUser: NotificationUser | null;
};

export type NotificationsResponse = {
    notifications: Notification[];
    nextCursor: number | null;
    total: number;
    unreadCount: number;
};

export type NotificationMessageResponse = {
    message: string;
};

export type NotificationPaginationQuery = {
    cursor?: string | number;
};

export type NotificationIdParams = {
    id: string | number;
};
