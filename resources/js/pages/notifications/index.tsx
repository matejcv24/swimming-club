import { Head, router } from '@inertiajs/react';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import dayjs from 'dayjs';
import { useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import { MuiThemeProvider, POPUP_BG } from '@/components/mui-theme-provider';
import { NotificationIcon } from '@/components/notification-icon';
import {
    ConfirmDialog,
    EmptyState,
    IconBadge,
    Note,
    PopupHeader,
} from '@/components/popup-ui';
import { usePagePopup } from '@/hooks/use-page-popup';
import { t, tc } from '@/lib/i18n';
import { showToast } from '@/lib/toast';
import type { AppNotification } from '@/types';

type Props = {
    /** Every notification of this club, newest first. */
    items: AppNotification[];
};

function formatNotificationDate(value: string | null) {
    if (!value) {
        return '';
    }

    return dayjs(value).format('DD.MM.YYYY HH:mm');
}

/**
 * All of the person's notifications in one list (unread ones bold, with a dot).
 * Each can be deleted, or all at once after a "are you sure?".
 */
export default function NotificationsIndex({ items }: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    const [confirmAll, setConfirmAll] = useState(false);
    const [busy, setBusy] = useState(false);
    const unread = items.filter((item) => !item.read_at).length;

    // Marks the notification as read, then opens the page it is about
    const openNotification = (notification: AppNotification) => {
        router.post(`/notifications/${notification.id}/read`);
    };

    const remove = (notification: AppNotification) => {
        router.delete(`/notifications/${notification.id}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const removeAll = () => {
        setBusy(true);
        router.delete('/notifications', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setConfirmAll(false);
                showToast(t('The notifications were deleted'), 'deleted');
            },
            onFinish: () => setBusy(false),
        });
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
                            unread,
                            total: items.length,
                        })}
                        onClose={popup.close}
                    />
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    {items.length === 0 ? (
                        <EmptyState
                            icon={<NotificationsNoneIcon />}
                            title={t('No notifications')}
                            text={t(
                                'You have not received any notifications yet.',
                            )}
                        />
                    ) : (
                        <ul className="divide-y divide-[var(--popup-border)] px-2 pb-2">
                            {items.map((notification) => {
                                const isUnread = !notification.read_at;

                                return (
                                    <li
                                        key={notification.id}
                                        className="flex items-center gap-1"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openNotification(notification)
                                            }
                                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[var(--popup-ghost)]"
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
                                        <button
                                            type="button"
                                            onClick={() => remove(notification)}
                                            aria-label={t(
                                                'Delete notification',
                                            )}
                                            className="flex size-10 flex-none cursor-pointer items-center justify-center rounded-full text-[var(--popup-muted)] transition hover:bg-red-500/10 hover:text-red-500"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </DialogContent>

                {items.length > 0 && (
                    // Same footer and button as the other pop-ups (Staff), in red
                    <div className="flex border-t border-[var(--popup-border)] px-4 py-3">
                        <Button
                            variant="contained"
                            color="error"
                            fullWidth
                            startIcon={<DeleteIcon />}
                            onClick={() => setConfirmAll(true)}
                            sx={{
                                whiteSpace: 'nowrap',
                                px: 1.5,
                                lineHeight: 1.15,
                                color: '#fff',
                            }}
                        >
                            {t('Delete all notifications')}
                        </Button>
                    </div>
                )}
            </Dialog>

            {/* "Delete all": asked once, it can't be undone */}
            <ConfirmDialog
                open={confirmAll}
                icon={<DeleteIcon fontSize="small" />}
                title={t('Delete all notifications?')}
                subtitle={tc(
                    ':count notification|:count notifications',
                    items.length,
                )}
                confirmLabel={t('Delete all')}
                busy={busy}
                onConfirm={removeAll}
                onClose={() => setConfirmAll(false)}
            >
                <Note tone="error">{t('This cannot be undone.')}</Note>
            </ConfirmDialog>
        </MuiThemeProvider>
    );
}
