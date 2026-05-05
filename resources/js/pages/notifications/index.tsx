import { Head, router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { AppNotification } from '@/types';

type Props = {
    unreadNotifications?: AppNotification[];
    allNotifications?: AppNotification[];
};

type ListNotificationsResponse = {
    unreadNotifications: AppNotification[];
    allNotifications: AppNotification[];
};

type ReadNotificationResponse = {
    url: string;
};

function formatNotificationDate(value: string | null) {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function NotificationsIndex({
    unreadNotifications: initialUnreadNotifications = [],
    allNotifications: initialAllNotifications = [],
}: Props) {
    const [unreadNotifications, setUnreadNotifications] = useState(
        initialUnreadNotifications,
    );
    const [allNotifications, setAllNotifications] = useState(
        initialAllNotifications,
    );
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(
        null,
    );

    useEffect(() => {
        const loadNotifications = async () => {
            setLoadingNotifications(true);
            setNotificationError(null);

            try {
                const data =
                    await apiRequest<ListNotificationsResponse>(
                        '/api/notifications',
                    );

                setUnreadNotifications(data.unreadNotifications);
                setAllNotifications(data.allNotifications);
            } catch {
                setNotificationError('Unable to load notifications.');
            } finally {
                setLoadingNotifications(false);
            }
        };

        void loadNotifications();
    }, []);

    const openNotification = async (notification: AppNotification) => {
        try {
            const data = await apiRequest<ReadNotificationResponse>(
                `/api/notifications/${notification.id}/read`,
                {
                    method: 'POST',
                },
            );

            router.visit(data.url);
        } catch {
            setNotificationError('Unable to open notification.');
        }
    };

    return (
        <>
            <Head title="Notifications" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {unreadNotifications.length} new notification
                            {unreadNotifications.length === 1 ? '' : 's'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.visit('/dashboard')}
                        className="relative flex size-11 items-center justify-center rounded-md border border-sidebar-border/70 bg-white transition hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        aria-label="Close notifications"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 bg-white dark:bg-neutral-900">
                    {notificationError && (
                        <div className="border-b border-sidebar-border/70 px-6 py-3 text-sm text-red-600">
                            {notificationError}
                        </div>
                    )}

                    {loadingNotifications ? (
                        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                            Loading notifications...
                        </div>
                    ) : allNotifications.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                            You have not received any notifications yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-sidebar-border/70">
                            {allNotifications.map((notification) => {
                                const isUnread = !notification.read_at;

                                return (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        onClick={() =>
                                            openNotification(notification)
                                        }
                                        className="flex w-full items-start gap-4 px-6 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-neutral-800"
                                    >
                                        <span
                                            className={`mt-2 size-2 shrink-0 rounded-full ${
                                                isUnread
                                                    ? 'bg-red-600'
                                                    : 'bg-transparent'
                                            }`}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span
                                                className={`block text-sm leading-5 ${
                                                    isUnread
                                                        ? 'font-semibold'
                                                        : 'font-medium'
                                                }`}
                                            >
                                                {notification.message}
                                            </span>
                                            <span className="mt-1 block text-xs text-muted-foreground">
                                                {formatNotificationDate(
                                                    notification.created_at,
                                                )}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Notifications',
            href: '/notifications',
        },
    ],
};
