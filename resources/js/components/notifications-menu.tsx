import { router, usePage } from '@inertiajs/react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Bell, X } from 'lucide-react';
import { useState } from 'react';
import { NotificationIcon } from '@/components/notification-icon';
import { IconBadge } from '@/components/popup-ui';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NotificationSharedData } from '@/types';

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
    const { notifications } = usePage().props as {
        notifications?: NotificationSharedData;
    };
    const unreadCount = notifications?.unread_count ?? 0;
    const unreadNotifications = notifications?.unread ?? [];

    // Marks only the clicked notification as read, then redirects to its page.
    const openNotification = (id: string) => {
        setOpen(false);
        router.post(`/notifications/${id}/read`);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="relative flex size-9 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:bg-hydra-blue/15 hover:text-hydra-blue data-[state=open]:bg-hydra-blue/15 data-[state=open]:text-hydra-blue"
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
            {/* Same look as the pop-ups: rounded panel, icon badges, blue unread dot */}
            <DropdownMenuContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="w-72 max-w-[calc(100vw-2rem)] rounded-2xl border-[var(--popup-border)] bg-[var(--popup-bg)] p-2 text-[var(--popup-fg)] shadow-xl sm:w-[22rem]"
            >
                <div className="flex items-center gap-3 px-2 pt-1.5 pb-2.5">
                    <IconBadge>
                        <NotificationsIcon fontSize="small" />
                    </IconBadge>
                    <div className="min-w-0">
                        <p className="text-[15px] leading-tight font-extrabold">
                            Notifications
                        </p>
                        <p className="text-xs text-[var(--popup-muted)]">
                            {unreadCount === 0
                                ? 'You are all caught up'
                                : `${unreadCount} unread`}
                        </p>
                    </div>
                </div>

                {unreadNotifications.length === 0 ? (
                    <p className="rounded-xl bg-[var(--popup-ghost)] px-3 py-5 text-center text-sm text-[var(--popup-muted)]">
                        No new notifications.
                    </p>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {unreadNotifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 focus:bg-[var(--popup-ghost)] focus:text-[var(--popup-fg)]"
                                onSelect={() =>
                                    openNotification(notification.id)
                                }
                            >
                                <IconBadge>
                                    <NotificationIcon
                                        type={notification.type}
                                    />
                                </IconBadge>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm leading-5 font-bold whitespace-normal">
                                        {notification.message}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-[var(--popup-muted)]">
                                        {formatNotificationDate(
                                            notification.created_at,
                                        )}
                                    </span>
                                </span>
                                <span
                                    className="size-2.5 flex-none rounded-full bg-hydra-blue"
                                    aria-label="Unread"
                                />
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}

                <DropdownMenuItem
                    className="mt-2 cursor-pointer justify-center rounded-full bg-hydra-blue py-2 text-sm font-bold text-white focus:bg-hydra-blue/90 focus:text-white"
                    onSelect={() => router.visit('/notifications')}
                >
                    See all notifications
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
