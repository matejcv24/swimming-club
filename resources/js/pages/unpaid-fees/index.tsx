import { Head, router, usePage } from '@inertiajs/react';
import EmailIcon from '@mui/icons-material/Email';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import UnsubscribeIcon from '@mui/icons-material/Unsubscribe';
import WarningIcon from '@mui/icons-material/Warning';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import {
    MuiThemeProvider,
    POPUP_BG,
    POPUP_FG,
    popupFg,
} from '@/components/mui-theme-provider';
import { FIELD_SX, Hint, PopupHeader } from '@/components/popup-ui';
import { usePagePopup } from '@/hooks/use-page-popup';
import { useGroups } from '@/lib/groups';
import { t, tc } from '@/lib/i18n';

interface UnpaidMember {
    id: number;
    name: string;
    group_id: number | null;
    parentName: string | null;
    phone: string | null;
    memberPhone: string | null;
    /** Where a reminder goes: the parent's email, else the member's (none: no email) */
    reminder_email: string | null;
    last_reminder_at: string | null;
    latest_end_date: string | null;
}

interface Props {
    unpaidMembers: UnpaidMember[];
}

/** The reminder as the server will send it (see PaymentReminderMessage). */
interface ReminderPreview {
    email: string;
    recipient_name: string | null;
    source: 'parent' | 'member';
    members: {
        id: number;
        name: string;
        unpaid_from: string | null;
        expired_on: string | null;
    }[];
    subject: string;
    /** A list paragraph is an array of lines */
    paragraphs: (string | string[])[];
    /** The same text as plain text, for editing */
    text: string;
    last_sent_at: string | null;
}

const date = (value: string) => dayjs(value).format('DD.MM.YYYY');

export default function UnpaidFeesIndex({ unpaidMembers }: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    const groups = useGroups();
    const { auth } = usePage().props as {
        auth?: { user?: { role?: string } | null };
    };
    // Only admins (and the owner) send payment reminders
    const canRemind = auth?.user?.role === 'admin';
    // 'all' or one group's id
    const [groupFilter, setGroupFilter] = useState<'all' | number>('all');
    const activeFilter =
        groupFilter !== 'all' && groups.some((g) => g.id === groupFilter)
            ? groupFilter
            : 'all';

    // The reminder being looked at before sending
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [preview, setPreview] = useState<{
        memberId: number;
        data: ReminderPreview;
    } | null>(null);
    const [sending, setSending] = useState(false);
    // The text as the admin edited it (starts as the fixed text)
    const [text, setText] = useState('');
    const [subject, setSubject] = useState('');
    const [error, setError] = useState<string | null>(null);

    // How many unpaid members each group has, shown in the drop-down
    const counts = unpaidMembers.reduce<Record<number, number>>(
        (all, member) => {
            if (member.group_id !== null) {
                all[member.group_id] = (all[member.group_id] ?? 0) + 1;
            }

            return all;
        },
        {},
    );

    const members =
        activeFilter === 'all'
            ? unpaidMembers
            : unpaidMembers.filter(
                  (member) =>
                      member.group_id === activeFilter ||
                      member.group_id === null,
              );

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    // Loads the exact email the server would send, and shows it
    const openPreview = async (member: UnpaidMember) => {
        if (loadingId !== null) {
            return;
        }

        setLoadingId(member.id);
        setError(null);

        try {
            const response = await fetch(`/unpaid-fees/${member.id}/reminder`, {
                headers: { Accept: 'application/json' },
            });
            const body = await response.json();

            if (response.ok) {
                setPreview({ memberId: member.id, data: body });
                setText(body.text);
                setSubject(body.subject);
            } else {
                setError(
                    body?.errors?.reminder?.[0] ??
                        t('The email could not be sent. Try again later.'),
                );
            }
        } catch {
            setError(t('The email could not be sent. Try again later.'));
        }

        setLoadingId(null);
    };

    const send = () => {
        if (!preview) {
            return;
        }

        setSending(true);
        setError(null);
        router.post(
            `/unpaid-fees/${preview.memberId}/reminder`,
            { text, subject },
            {
                preserveScroll: true,
                onSuccess: () => setPreview(null),
                onError: (errors) =>
                    setError(
                        errors.reminder ??
                            t('The email could not be sent. Try again later.'),
                    ),
                onFinish: () => setSending(false),
            },
        );
    };

    // The round button on each row: ready, loading, already sent, or no email
    const reminderButton = (member: UnpaidMember) => {
        if (!member.reminder_email) {
            return (
                <Hint title={t('No email saved')}>
                    <span
                        role="img"
                        aria-label={t('No email saved')}
                        className="flex size-10 items-center justify-center rounded-full border border-dashed border-[var(--popup-border)] text-[var(--popup-muted)]"
                    >
                        <UnsubscribeIcon fontSize="small" />
                    </span>
                </Hint>
            );
        }

        const sent = !!member.last_reminder_at;

        return (
            <button
                type="button"
                onClick={() => openPreview(member)}
                aria-label={t('Send reminder to :name', { name: member.name })}
                aria-busy={loadingId === member.id}
                className={`flex size-10 cursor-pointer items-center justify-center rounded-full transition active:scale-95 ${
                    sent
                        ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                        : 'bg-hydra-blue/15 text-hydra-blue hover:bg-hydra-blue/25 dark:bg-sky-400/20 dark:text-sky-300'
                }`}
            >
                {loadingId === member.id ? (
                    <CircularProgress size={18} color="inherit" />
                ) : sent ? (
                    <MarkEmailReadIcon fontSize="small" />
                ) : (
                    <EmailIcon fontSize="small" />
                )}
            </button>
        );
    };

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title={t('Unpaid Fees')} />

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
                        icon={<WarningIcon fontSize="small" />}
                        title={t('Unpaid Fees')}
                        subtitle={tc(
                            ':count member late with payment|:count members late with payment',
                            unpaidMembers.length,
                        )}
                        onClose={popup.close}
                    />
                    <div className="px-[18px] pb-3">
                        <FormControl fullWidth size="small">
                            <InputLabel
                                id="unpaid-group-label"
                                sx={{ color: popupFg(0.5) }}
                            >
                                {t('Group')}
                            </InputLabel>
                            <Select
                                labelId="unpaid-group-label"
                                label={t('Group')}
                                value={activeFilter}
                                onChange={(e) =>
                                    setGroupFilter(
                                        e.target.value === 'all'
                                            ? 'all'
                                            : Number(e.target.value),
                                    )
                                }
                                sx={{
                                    color: POPUP_FG,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: popupFg(0.3),
                                    },
                                    '& .MuiSvgIcon-root': { color: POPUP_FG },
                                }}
                            >
                                <MenuItem value="all">
                                    {t('All (:count)', {
                                        count: unpaidMembers.length,
                                    })}
                                </MenuItem>
                                {groups.map((group) => (
                                    <MenuItem key={group.id} value={group.id}>
                                        {group.name} ({counts[group.id] ?? 0})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                    {/* A reminder that couldn't be opened (no email, not late any more) */}
                    {error && !preview && (
                        <p className="mx-[18px] mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
                            {error}
                        </p>
                    )}
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    {members.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 6 }}
                        >
                            {activeFilter === 'all'
                                ? t('No overdue members.')
                                : t('No overdue members in this group.')}
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {members.map((member) => (
                                <ListItem
                                    key={member.id}
                                    divider
                                    secondaryAction={
                                        canRemind
                                            ? reminderButton(member)
                                            : undefined
                                    }
                                    sx={canRemind ? { pr: 8 } : undefined}
                                >
                                    <ListItemAvatar>
                                        <Avatar>
                                            {getInitials(member.name)}
                                        </Avatar>
                                    </ListItemAvatar>

                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="body1"
                                                fontWeight="bold"
                                            >
                                                {member.name}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                {/* No parent: nothing to show about one */}
                                                {member.parentName && (
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            display: 'block',
                                                        }}
                                                    >
                                                        {t('Parent:')}{' '}
                                                        {member.parentName}
                                                    </Typography>
                                                )}
                                                {/* The parent's phone, else the member's own */}
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ display: 'block' }}
                                                >
                                                    {member.phone
                                                        ? t('Parent phone:')
                                                        : member.memberPhone
                                                          ? t("Member's phone:")
                                                          : t('Phone:')}{' '}
                                                    {member.phone ||
                                                    member.memberPhone ? (
                                                        <Link
                                                            href={`tel:${(member.phone || member.memberPhone || '').replace(/[^\d+]/g, '')}`}
                                                            underline="none"
                                                        >
                                                            {member.phone ||
                                                                member.memberPhone}
                                                        </Link>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="error"
                                                    sx={{ display: 'block' }}
                                                >
                                                    {t('Expired:')}{' '}
                                                    {member.latest_end_date
                                                        ? date(
                                                              member.latest_end_date,
                                                          )
                                                        : t('No recorded fee')}
                                                </Typography>
                                                {/* Already reminded: said in words, not only by the icon */}
                                                {member.last_reminder_at && (
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        sx={{
                                                            display: 'block',
                                                            color: 'success.main',
                                                        }}
                                                    >
                                                        ✓{' '}
                                                        {t(
                                                            'Reminder sent :date',
                                                            {
                                                                date: date(
                                                                    member.last_reminder_at,
                                                                ),
                                                            },
                                                        )}
                                                    </Typography>
                                                )}
                                            </>
                                        }
                                        secondaryTypographyProps={{
                                            component: 'div',
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>

            {/* The reminder exactly as it will be sent: Cancel, or Send */}
            <Dialog
                open={!!preview}
                onClose={() => !sending && setPreview(null)}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<EmailIcon fontSize="small" />}
                        title={t('Payment reminder')}
                        subtitle={t('Check it and send')}
                        onClose={() => !sending && setPreview(null)}
                    />
                </DialogTitle>
                {preview && (
                    <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                        <div className="flex flex-col gap-4 pt-1 pb-2">
                            {preview.data.last_sent_at && (
                                <p className="flex gap-2 rounded-xl bg-amber-500/15 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                                    <WarningIcon
                                        fontSize="small"
                                        sx={{ mt: '1px' }}
                                    />
                                    {t(
                                        'Already sent on :date. Send again only if needed.',
                                        {
                                            date: date(
                                                preview.data.last_sent_at,
                                            ),
                                        },
                                    )}
                                </p>
                            )}

                            <div>
                                <p className="text-[11px] tracking-wider text-[var(--popup-muted)] uppercase">
                                    {t('To')}
                                </p>
                                <p className="text-[15px] break-words text-[var(--popup-fg)]">
                                    {preview.data.recipient_name &&
                                        `${preview.data.recipient_name} · `}
                                    {preview.data.email}
                                </p>
                                <p className="text-xs text-[var(--popup-muted)]">
                                    {preview.data.source === 'parent'
                                        ? t("parent's email")
                                        : t("member's own email")}
                                </p>
                            </div>

                            <div>
                                <p className="text-[11px] tracking-wider text-[var(--popup-muted)] uppercase">
                                    {t('For')}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {preview.data.members.map((late) => (
                                        <span
                                            key={late.id}
                                            className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-300"
                                        >
                                            {late.name} ·{' '}
                                            {late.expired_on
                                                ? t('expired on :date', {
                                                      date: date(
                                                          late.expired_on,
                                                      ),
                                                  })
                                                : t('no payment on record')}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* The email: the subject and the text, both can be changed */}
                            <TextField
                                label={t('Subject')}
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                fullWidth
                                required
                                slotProps={{ htmlInput: { maxLength: 200 } }}
                                sx={FIELD_SX}
                            />
                            <TextField
                                label={t('Message')}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                multiline
                                minRows={7}
                                fullWidth
                                slotProps={{ htmlInput: { maxLength: 5000 } }}
                                helperText={t(
                                    'You can change the text before sending.',
                                )}
                                sx={FIELD_SX}
                            />
                            {(text !== preview.data.text ||
                                subject !== preview.data.subject) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setText(preview.data.text);
                                        setSubject(preview.data.subject);
                                    }}
                                    className="-mt-2 cursor-pointer self-start text-sm font-semibold text-hydra-blue hover:underline dark:text-sky-300"
                                >
                                    {t('Restore the original text')}
                                </button>
                            )}
                            <p className="-mt-1 text-xs text-[var(--popup-muted)]">
                                {t(
                                    'The email also has a button “View attendance and payments”, working for 60 days.',
                                )}{' '}
                                {t("Replies go to the club's email.")}
                            </p>

                            {error && (
                                <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
                                    {error}
                                </p>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    disabled={sending}
                                    onClick={() => setPreview(null)}
                                >
                                    {t('Cancel')}
                                </Button>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    disabled={sending}
                                    onClick={send}
                                    sx={{ whiteSpace: 'nowrap' }}
                                >
                                    {sending ? (
                                        <CircularProgress
                                            size={18}
                                            color="inherit"
                                        />
                                    ) : preview.data.last_sent_at ? (
                                        t('Send again')
                                    ) : (
                                        t('Send')
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </MuiThemeProvider>
    );
}
