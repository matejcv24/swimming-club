import { Head, router } from '@inertiajs/react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import dayjs from 'dayjs';
import { useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import { MuiThemeProvider, POPUP_BG } from '@/components/mui-theme-provider';
import { NotificationIcon } from '@/components/notification-icon';
import { IconBadge, PopupHeader } from '@/components/popup-ui';
import { usePagePopup } from '@/hooks/use-page-popup';
import { t } from '@/lib/i18n';
import type { AppNotification } from '@/types';

type Props = {
    unreadNotifications: AppNotification[];
    allNotifications: AppNotification[];
};

function formatNotificationDate(value: string | null) {
    if (!value) {
        return '';
    }

    return dayjs(value).format('DD.MM.YYYY HH:mm');
}

export default function NotificationsIndex({
    unreadNotifications,
    allNotifications,
}: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    const [tab, setTab] = useState(0);
    const shown = tab === 0 ? allNotifications : unreadNotifications;

    // Marks the notification as read, then opens the page it is about
    const openNotification = (notification: AppNotification) => {
        router.post(`/notifications/${notification.id}/read`);
    };

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title={t('Notifications')} />

            <Dialog
                {...popup.dialogProps}
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
                        title={t('Notifications')}
                        subtitle={t(':unread unread · :total in total', {
                            unread: unreadNotifications.length,
                            total: allNotifications.length,
                        })}
                        onClose={popup.close}
                    />
                    <Tabs
                        value={tab}
                        onChange={(_, value) => setTab(value)}
                        variant="fullWidth"
                    >
                        <Tab
                            label={t('All (:count)', {
                                count: allNotifications.length,
                            })}
                        />
                        <Tab
                            label={t('Unread (:count)', {
                                count: unreadNotifications.length,
                            })}
                        />
                    </Tabs>
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    {shown.length === 0 ? (
                        <p className="mt-12 text-center text-sm text-[var(--popup-muted)]">
                            {tab === 0
                                ? t(
                                      'You have not received any notifications yet.',
                                  )
                                : t('No unread notifications.')}
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
                                                aria-label={t('Unread')}
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
