export type AppNotification = {
    id: string;
    message: string;
    url: string;
    type: string;
    created_at: string | null;
    read_at: string | null;
};

export type NotificationSharedData = {
    unread_count: number;
    unread: AppNotification[];
    all: AppNotification[];
};
