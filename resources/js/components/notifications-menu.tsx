import { router, usePage } from '@inertiajs/react';
import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/api';
import type { AppNotification } from '@/types';
import type { NotificationSharedData } from '@/types';

type ReadAllNotificationsResponse = {
    unreadNotifications: AppNotification[];
};

function formatNotificationDate(value: string | null) {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export function NotificationsMenu() {
    const [open, setOpen] = useState(false);
    const [hasViewedUnread, setHasViewedUnread] = useState(false);
    const { notifications } = usePage().props as {
        notifications?: NotificationSharedData;
    };
    const [unreadNotifications, setUnreadNotifications] = useState(
        notifications?.unread ?? [],
    );
    const unreadCount = unreadNotifications.length;

    useEffect(() => {
        setUnreadNotifications(notifications?.unread ?? []);
    }, [notifications?.unread]);

    const markViewedNotificationsAsRead = async (afterRead?: () => void) => {
        if (!hasViewedUnread) {
            return;
        }

        try {
            const data = await apiRequest<ReadAllNotificationsResponse>(
                '/api/notifications/read-all',
                {
                    method: 'POST',
                },
            );

            setUnreadNotifications(data.unreadNotifications);
            setHasViewedUnread(false);
            afterRead?.();
        } catch {
            setHasViewedUnread(false);
            afterRead?.();
        }
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen && unreadCount > 0) {
            setHasViewedUnread(true);
        }

        if (!nextOpen) {
            void markViewedNotificationsAsRead();
        }

        setOpen(nextOpen);
    };

    const openNotification = (url: string) => {
        setOpen(false);

        if (hasViewedUnread) {
            void markViewedNotificationsAsRead(() => router.visit(url));

            return;
        }

        router.visit(url);
    };

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="relative flex size-9 items-center justify-center rounded-md text-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    aria-label={open ? 'Close notifications' : 'Notifications'}
                >
                    {open ? (
                        <X className="size-5" />
                    ) : (
                        <Bell className="size-5" />
                    )}
                    {!open && unreadCount > 0 && (
                        <span className="absolute top-0 right-0 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] leading-4 font-semibold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side="bottom"
                align="end"
                className="w-64 max-w-[calc(100vw-2rem)] sm:w-80"
            >
                <DropdownMenuLabel className="flex items-center justify-between gap-3">
                    <span>New notifications</span>
                    {unreadCount > 0 && (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                            {unreadCount}
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {unreadNotifications.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No new notifications.
                    </div>
                ) : (
                    unreadNotifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            className="cursor-pointer items-start gap-3 py-3"
                            onSelect={() => openNotification(notification.url)}
                        >
                            <span className="mt-1 size-2 shrink-0 rounded-full bg-red-600" />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm leading-5 whitespace-normal">
                                    {notification.message}
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    {formatNotificationDate(
                                        notification.created_at,
                                    )}
                                </span>
                            </span>
                        </DropdownMenuItem>
                    ))
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer justify-center font-medium"
                    onSelect={() => router.visit('/notifications')}
                >
                    See more
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
