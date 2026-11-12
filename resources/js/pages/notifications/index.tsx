import { Head, router } from '@inertiajs/react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import { MuiThemeProvider, POPUP_BG } from '@/components/mui-theme-provider';
import { NotificationIcon } from '@/components/notification-icon';
import { IconBadge, PopupHeader } from '@/components/popup-ui';
import type { AppNotification } from '@/types';

type Props = {
    unreadNotifications: AppNotification[];
    allNotifications: AppNotification[];
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
    unreadNotifications,
    allNotifications,
}: Props) {
    const [tab, setTab] = useState(0);
    const shown = tab === 0 ? allNotifications : unreadNotifications;

    // Marks the notification as read, then opens the page it is about
    const openNotification = (notification: AppNotification) => {
        router.post(`/notifications/${notification.id}/read`);
    };

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title="Notifications" />

            <Dialog
                open={true}
                onClose={() => router.visit('/dashboard')}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        height: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: POPUP_BG,
                    },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<NotificationsIcon fontSize="small" />}
                        title="Notifications"
                        subtitle={`${unreadNotifications.length} unread · ${allNotifications.length} in total`}
                        onClose={() => router.visit('/dashboard')}
                    />
                    <Tabs
                        value={tab}
                        onChange={(_, value) => setTab(value)}
                        variant="fullWidth"
                    >
                        <Tab label={`All (${allNotifications.length})`} />
                        <Tab label={`Unread (${unreadNotifications.length})`} />
                    </Tabs>
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    {shown.length === 0 ? (
                        <p className="mt-12 text-center text-sm text-[var(--popup-muted)]">
                            {tab === 0
                                ? 'You have not received any notifications yet.'
                                : 'No unread notifications.'}
                        </p>
                    ) : (
                        <div className="divide-y divide-[var(--popup-border)] px-2 pb-2">
                            {shown.map((notification) => {
                                const isUnread = !notification.read_at;

                                return (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        onClick={() =>
                                            openNotification(notification)
                                        }
                                        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[var(--popup-ghost)]"
                                    >
                                        <IconBadge>
                                            <NotificationIcon
                                                type={notification.type}
                                            />
                                        </IconBadge>
                                        <span className="min-w-0 flex-1">
                                            <span
                                                className={`block text-sm leading-5 text-[var(--popup-fg)] ${
                                                    isUnread
                                                        ? 'font-bold'
                                                        : 'font-normal'
                                                }`}
                                            >
                                                {notification.message}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-[var(--popup-muted)]">
                                                {formatNotificationDate(
                                                    notification.created_at,
                                                )}
                                            </span>
                                        </span>
                                        {isUnread && (
                                            <span
                                                className="size-2.5 flex-none rounded-full bg-hydra-blue"
                                                aria-label="Unread"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
}
