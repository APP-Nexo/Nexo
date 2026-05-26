export type NotificationUser = {
    id: number;
    name: string;
};

export type Notification = {
    id: number;
    toUserId: number;
    createdAt: Date;
    read: boolean;
    fromUser: NotificationUser;
};

export type NotificationsResponse = {
    notifications: Notification[];
    nextCursor: number | null;
    total: number;
};

export type NotificationMessageResponse = {
    message: string;
};
