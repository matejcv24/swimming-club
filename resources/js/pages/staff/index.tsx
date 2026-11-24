import { Head, router } from '@inertiajs/react';
import BlockIcon from '@mui/icons-material/Block';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import type { FormEvent, MouseEvent, ReactNode } from 'react';
import {
    CoachGroupsField,
    coachGroupsLabel,
} from '@/components/coach-groups-field';
import type { CoachGroups } from '@/components/coach-groups-field';
import { DashboardBackground } from '@/components/dashboard-background';
import {
    MuiThemeProvider,
    POPUP_BG,
    POPUP_FG,
    popupFg,
} from '@/components/mui-theme-provider';
import {
    avatarSx,
    CloseButton,
    FIELD_SX,
    PopupHeader,
    ShowHistoryButton,
} from '@/components/popup-ui';
import { CardsSkeleton } from '@/components/skeletons';
import { usePagePopup } from '@/hooks/use-page-popup';
import { useGroups } from '@/lib/groups';
import { locale, pickerLocaleText, t, tc } from '@/lib/i18n';

type Role = 'admin' | 'coach';

interface Staff extends CoachGroups {
    id: number;
    name: string;
    email: string;
    role: Role;
    /** False: deactivated, can't log in */
    active: boolean;
    deactivated_at: string | null;
    /** The admin looking at the list (can't deactivate themselves) */
    is_self: boolean;
    /** The club's owner: other admins can't deactivate or change them */
    is_owner: boolean;
    /** A salary is recorded for this month */
    salary_this_month: boolean;
    /** Every month with a salary, as YYYY-MM */
    salary_months: string[];
}

/** An invitation not accepted yet. */
interface Invite extends CoachGroups {
    id: number;
    name: string;
    email: string;
    role: Role;
    invited_at: string | null;
    expired: boolean;
    /** The email couldn't be sent: the link has to be copied */
    email_failed: boolean;
    link: string;
}

// New coaches start with no group chosen: the admin must pick
const NO_GROUPS: CoachGroups = { all_groups: false, group_ids: [] };

// Most people invited are coaches
const EMPTY_INVITE = {
    name: '',
    email: '',
    role: 'coach' as Role,
    ...NO_GROUPS,
};

interface Salary {
    id: number;
    amount: number;
    month: string;
}

interface GroupedSalaryByMonth {
    month: string;
    total: number;
}

interface Props {
    staff: Staff[];
    invitations: Invite[];
}

const datePickerSx = {
    '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: popupFg(0.3) },
        '&:hover fieldset': { borderColor: POPUP_FG },
        '&.Mui-focused fieldset': { borderColor: POPUP_FG },
    },
    '& .MuiInputLabel-root': { color: popupFg(0.5) },
    '& .MuiInputBase-input': { color: POPUP_FG },
    '& .MuiSvgIcon-root': { color: POPUP_FG },
};

const SUBHEADER_SX = {
    bgcolor: POPUP_BG,
    color: 'var(--popup-muted)',
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    lineHeight: '34px',
    px: 2.25,
} as const;

// A pair of buttons whose labels must stay on one line (Macedonian is longer)
const ONE_LINE_SX = {
    whiteSpace: 'nowrap',
    px: 1,
    minWidth: 0,
    fontSize: { xs: 13, sm: 14 },
} as const;

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
};

const getInitials = (name: string) =>
    name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

/** Copies text, also where the browser's clipboard API isn't available. */
async function copyText(text: string, from?: HTMLElement): Promise<boolean> {
    // The modern way works only on https (the live site)
    if (window.isSecureContext && navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(text);

            return true;
        } catch {
            // Try the older way below
        }
    }

    // The older way: select hidden text and copy it. Inside the open pop-up,
    // since a pop-up keeps the focus (and the selection) to itself.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '0';
    area.style.opacity = '0';
    (from?.closest('[role="dialog"]') ?? document.body).appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);

    let copied = false;

    try {
        copied = document.execCommand('copy');
    } catch {
        copied = false;
    }

    area.remove();
    from?.focus();

    return copied;
}

export default function StaffIndex({ staff, invitations }: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    const groups = useGroups();
    const month = dayjs().format('MMMM').toLowerCase();

    // The person whose card is open (null: closed)
    const [person, setPerson] = useState<Staff | null>(null);

    // Inviting someone
    const [inviting, setInviting] = useState(false);
    const [invite, setInvite] = useState(EMPTY_INVITE);
    const [inviteErrors, setInviteErrors] = useState<Record<string, string>>(
        {},
    );
    const [sendingInvite, setSendingInvite] = useState(false);
    // The invitation whose link was just copied
    const [copiedId, setCopiedId] = useState<number | null>(null);
    // "Send again": sending (spinner), then sent or failed for a moment
    const [resend, setResend] = useState<{
        id: number;
        state: 'sending' | 'sent' | 'failed';
    } | null>(null);
    // The invitation whose link is shown (when the browser couldn't copy it)
    const [shownLinkId, setShownLinkId] = useState<number | null>(null);
    const [showDeactivated, setShowDeactivated] = useState(false);

    // The coach being edited (null: the Edit Coach pop-up is closed)
    const [editingCoach, setEditingCoach] = useState<Staff | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        password: '',
        ...NO_GROUPS,
    });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    // Asking before deactivating someone
    const [deactivating, setDeactivating] = useState<Staff | null>(null);

    // "Enter salary": one person after another, this month by default
    const [salaryEntry, setSalaryEntry] = useState<{
        userId: number | '';
        amount: string;
        month: Dayjs;
        /** The name of the person whose salary was just saved */
        saved: string | null;
        errors: Record<string, string>;
        saving: boolean;
    } | null>(null);

    const active = staff.filter((p) => p.active);
    const owners = active.filter((p) => p.is_owner);
    const admins = active.filter((p) => !p.is_owner && p.role === 'admin');
    const coaches = active.filter((p) => !p.is_owner && p.role === 'coach');
    const deactivated = staff.filter((p) => !p.active);

    // Owner, admins, coaches: each as its own section
    const sections = [
        { key: 'owner', title: t('Owner'), people: owners },
        { key: 'admin', title: t('Admins'), people: admins },
        { key: 'coach', title: t('Coaches'), people: coaches },
    ].filter((section) => section.people.length > 0);

    const summary = [
        owners.length > 0 && tc(':count owner|:count owners', owners.length),
        admins.length > 0 && tc(':count admin|:count admins', admins.length),
        coaches.length > 0 && tc(':count coach|:count coaches', coaches.length),
        invitations.length > 0 &&
            tc(':count invited|:count invited', invitations.length),
    ]
        .filter(Boolean)
        .join(' · ');

    const roleLabel = (role: Role) =>
        role === 'admin' ? t('Admin') : t('Coach');

    // What a person's row says under their name
    const describe = (member: Staff) => {
        if (!member.active) {
            return t("Can't log in since :date", {
                date: dayjs(member.deactivated_at).format('DD.MM.YYYY'),
            });
        }

        // Admins (and the owner) work with every group
        return member.role === 'admin'
            ? t('All groups')
            : coachGroupsLabel(member, groups);
    };

    const invitedAgo = (invite: Invite) => {
        const days = invite.invited_at
            ? dayjs()
                  .startOf('day')
                  .diff(dayjs(invite.invited_at).startOf('day'), 'day')
            : 0;

        return days <= 0
            ? t('invited today')
            : tc('invited :count day ago|invited :count days ago', days);
    };

    // Has a salary for that month
    const hasSalary = (member: Staff, salaryMonth: Dayjs) =>
        member.salary_months.includes(salaryMonth.format('YYYY-MM'));

    // Who still needs that month's salary comes first
    const salaryPeople = (people: Staff[], salaryMonth: Dayjs) =>
        people
            .filter((p) => p.active)
            .sort(
                (a, b) =>
                    Number(hasSalary(a, salaryMonth)) -
                        Number(hasSalary(b, salaryMonth)) ||
                    a.name.localeCompare(b.name),
            );

    const openSalaryEntry = () => {
        setSalaryEntry({
            userId: '',
            amount: '',
            month: dayjs().startOf('month'),
            saved: null,
            errors: {},
            saving: false,
        });
    };

    const saveSalaryEntry = (e: FormEvent) => {
        e.preventDefault();

        if (!salaryEntry || salaryEntry.userId === '') {
            return;
        }

        const entry = salaryEntry;
        const name = staff.find((p) => p.id === entry.userId)?.name ?? '';
        setSalaryEntry({ ...entry, saving: true });

        router.post(
            '/salaries',
            {
                user_id: entry.userId,
                amount: entry.amount,
                month: entry.month.startOf('month').format('YYYY-MM-DD'),
            },
            {
                preserveScroll: true,
                // Ready for the next one: the person is chosen again
                onSuccess: () =>
                    setSalaryEntry({
                        ...entry,
                        userId: '',
                        amount: '',
                        saved: name,
                        errors: {},
                        saving: false,
                    }),
                onError: (errors) =>
                    setSalaryEntry({ ...entry, errors, saving: false }),
            },
        );
    };

    const setActive = (member: Staff, isActive: boolean) =>
        router.put(
            `/staff/${member.id}/active`,
            { active: isActive },
            {
                preserveScroll: true,
                onSuccess: () => setDeactivating(null),
            },
        );

    const openInvite = () => {
        setInvite(EMPTY_INVITE);
        setInviteErrors({});
        setInviting(true);
    };

    const sendInvite = (e: FormEvent) => {
        e.preventDefault();
        setSendingInvite(true);
        router.post('/staff/invitations', invite, {
            preserveScroll: true,
            onSuccess: () => {
                setInviting(false);
                setInvite(EMPTY_INVITE);
                setInviteErrors({});
            },
            onError: (errors) => setInviteErrors(errors),
            onFinish: () => setSendingInvite(false),
        });
    };

    const resendInvite = (invitation: Invite) => {
        if (resend?.state === 'sending') {
            return;
        }

        const id = invitation.id;
        const settle = (state: 'sent' | 'failed') => {
            setResend({ id, state });
            window.setTimeout(
                () => setResend((r) => (r?.id === id ? null : r)),
                3000,
            );
        };

        setResend({ id, state: 'sending' });
        router.post(
            `/staff/invitations/${id}/resend`,
            {},
            {
                preserveScroll: true,
                // The list comes back with whether the email went out
                onSuccess: (page) => {
                    const fresh = (
                        page.props as { invitations?: Invite[] }
                    ).invitations?.find((i) => i.id === id);
                    settle(fresh && !fresh.email_failed ? 'sent' : 'failed');
                },
                onError: () => settle('failed'),
            },
        );
    };

    const cancelInvite = (invitation: Invite) =>
        router.delete(`/staff/invitations/${invitation.id}`, {
            preserveScroll: true,
        });

    const copyLink = async (invitation: Invite, from: HTMLElement) => {
        if (await copyText(invitation.link, from)) {
            setShownLinkId(null);
            setCopiedId(invitation.id);
            window.setTimeout(
                () => setCopiedId((id) => (id === invitation.id ? null : id)),
                2500,
            );
        } else {
            // The browser wouldn't copy: show the link to copy by hand
            setShownLinkId(invitation.id);
        }
    };

    const [selectedCoach, setSelectedCoach] = useState<Staff | null>(null);
    const [salaries, setSalaries] = useState<Salary[]>([]);
    const [loadingSalaries, setLoadingSalaries] = useState(false);
    // A salary being corrected (amount, month) or deleted
    const [editingSalary, setEditingSalary] = useState<{
        id: number;
        amount: string;
        month: Dayjs;
        errors: Record<string, string>;
        saving: boolean;
        confirmingDelete: boolean;
    } | null>(null);
    const [showSalaryHistoryModal, setShowSalaryHistoryModal] = useState(false);
    const [showSalaryYearDetailModal, setShowSalaryYearDetailModal] =
        useState(false);
    const [selectedSalaryYear, setSelectedSalaryYear] = useState<string | null>(
        null,
    );

    const groupedSalaries: Record<string, GroupedSalaryByMonth> = {};

    salaries.forEach((salary) => {
        const monthKey = dayjs(salary.month)
            .startOf('month')
            .format('YYYY-MM-DD');

        if (!groupedSalaries[monthKey]) {
            groupedSalaries[monthKey] = {
                month: monthKey,
                total: 0,
            };
        }

        groupedSalaries[monthKey].total += Number(salary.amount);
    });

    const sortedSalaryMonths = Object.keys(groupedSalaries).sort().reverse();
    const currentYear = dayjs().format('YYYY');

    const currentYearSalaryMonths = sortedSalaryMonths.filter(
        (month) => dayjs(month).format('YYYY') === currentYear,
    );

    const currentYearLastSalaryMonth = currentYearSalaryMonths[0];
    const currentYearLastSalary = currentYearLastSalaryMonth
        ? groupedSalaries[currentYearLastSalaryMonth]
        : null;

    const salaryYearGroups: Record<
        string,
        { year: string; total: number; monthCount: number }
    > = {};

    Object.values(groupedSalaries).forEach((monthData) => {
        const year = dayjs(monthData.month).format('YYYY');

        if (!salaryYearGroups[year]) {
            salaryYearGroups[year] = {
                year,
                total: 0,
                monthCount: 0,
            };
        }

        salaryYearGroups[year].total += monthData.total;
        salaryYearGroups[year].monthCount += 1;
    });

    const sortedSalaryYears = Object.keys(salaryYearGroups)
        .filter((year) => year !== currentYear)
        .sort()
        .reverse();

    const salaryYearMonths = selectedSalaryYear
        ? sortedSalaryMonths.filter(
              (month) => dayjs(month).format('YYYY') === selectedSalaryYear,
          )
        : [];

    const handleEditOpen = (coach: Staff) => {
        setEditForm({
            name: coach.name,
            email: coach.email,
            password: '',
            all_groups: coach.all_groups,
            group_ids: coach.group_ids,
        });
        setEditErrors({});
        setEditingCoach(coach);
    };

    const closeEdit = () => setEditingCoach(null);

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingCoach) {
            return;
        }

        router.put(`/staff/${editingCoach.id}`, editForm, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingCoach(null);
                setEditForm({
                    name: '',
                    email: '',
                    password: '',
                    ...NO_GROUPS,
                });
                setEditErrors({});
            },
            onError: (errors) => setEditErrors(errors),
        });
    };

    const loadSalaries = async (coachId: number) => {
        try {
            const response = await fetch(`/salaries/by-coach/${coachId}`);
            const data = await response.json();
            setSalaries(data.salaries ?? []);
        } catch {
            setSalaries([]);
        }
    };

    const handleCoachClick = async (coach: Staff) => {
        setSelectedCoach(coach);
        setSalaries([]);
        setLoadingSalaries(true);
        setShowSalaryHistoryModal(false);
        setShowSalaryYearDetailModal(false);
        setSelectedSalaryYear(null);
        await loadSalaries(coach.id);
        setLoadingSalaries(false);
    };

    const openSalaryEdit = (salary: Salary) =>
        setEditingSalary({
            id: salary.id,
            amount: String(Number(salary.amount)),
            month: dayjs(salary.month).startOf('month'),
            errors: {},
            saving: false,
            confirmingDelete: false,
        });

    const afterSalaryChange = () => {
        setEditingSalary(null);

        if (selectedCoach) {
            loadSalaries(selectedCoach.id);
        }
    };

    const saveSalaryEdit = (e: FormEvent) => {
        e.preventDefault();

        if (!editingSalary) {
            return;
        }

        const edit = editingSalary;
        setEditingSalary({ ...edit, saving: true });
        router.put(
            `/salaries/${edit.id}`,
            {
                amount: edit.amount,
                month: edit.month.startOf('month').format('YYYY-MM-DD'),
            },
            {
                preserveScroll: true,
                onSuccess: afterSalaryChange,
                onError: (errors) =>
                    setEditingSalary({ ...edit, errors, saving: false }),
            },
        );
    };

    const deleteSalary = () => {
        if (!editingSalary) {
            return;
        }

        setEditingSalary({ ...editingSalary, saving: true });
        router.delete(`/salaries/${editingSalary.id}`, {
            preserveScroll: true,
            onSuccess: afterSalaryChange,
        });
    };

    // Each salary of those months, with a button to correct it
    const salaryRows = (months: string[]) => (
        <List disablePadding>
            {months.flatMap((month) =>
                salaries
                    .filter((salary) =>
                        dayjs(salary.month).isSame(month, 'month'),
                    )
                    .map((salary) => (
                        <ListItem
                            key={salary.id}
                            divider
                            sx={{ px: 2, gap: 1 }}
                        >
                            <ListItemText
                                primary={
                                    <Typography variant="body2">
                                        {dayjs(month).format('MMMM YYYY')}
                                    </Typography>
                                }
                                sx={{ flex: '1 1 auto', minWidth: 0 }}
                            />
                            <Chip
                                label={`${formatCurrency(Number(salary.amount))} MKD`}
                                color="success"
                                size="small"
                                sx={{ flexShrink: 0 }}
                            />
                            <IconButton
                                size="small"
                                color="primary"
                                aria-label={t('Edit salary for :month', {
                                    month: dayjs(month).format('MMMM YYYY'),
                                })}
                                onClick={() => openSalaryEdit(salary)}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </ListItem>
                    )),
            )}
        </List>
    );

    // One person's row: tapping it opens their card
    const personRow = (member: Staff, index: number) => (
        <ListItemButton
            key={member.id}
            divider
            onClick={() => setPerson(member)}
            sx={{ px: 2.25, opacity: member.active ? 1 : 0.6 }}
        >
            <ListItemAvatar>
                <Avatar
                    sx={
                        member.active
                            ? avatarSx(index)
                            : { bgcolor: popupFg(0.15), color: POPUP_FG }
                    }
                >
                    {member.active ? (
                        getInitials(member.name)
                    ) : (
                        <BlockIcon fontSize="small" />
                    )}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={
                    <Typography variant="body1" fontWeight="bold" noWrap>
                        {member.name}
                    </Typography>
                }
                secondary={
                    <Typography
                        variant="caption"
                        component="span"
                        noWrap
                        sx={{
                            display: 'block',
                            color: member.active
                                ? 'var(--popup-muted)'
                                : 'error.main',
                        }}
                    >
                        {describe(member)}
                    </Typography>
                }
                sx={{ minWidth: 0 }}
            />
            <ChevronRightIcon sx={{ color: 'var(--popup-muted)', ml: 1 }} />
        </ListItemButton>
    );

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title={t('Team and salaries')} />

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
                        icon={<PersonIcon fontSize="small" />}
                        title={t('Team and salaries')}
                        subtitle={summary}
                        onClose={popup.close}
                    />
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    <List disablePadding>
                        {sections.map((section) => (
                            <li key={section.key}>
                                <ul>
                                    <ListSubheader sx={SUBHEADER_SX}>
                                        {section.title}
                                    </ListSubheader>
                                    {section.people.map(personRow)}
                                </ul>
                            </li>
                        ))}

                        {/* Invited, not joined yet: send again, copy the link, or cancel */}
                        {invitations.length > 0 && (
                            <li>
                                <ul>
                                    <ListSubheader sx={SUBHEADER_SX}>
                                        {t('Invited')}
                                    </ListSubheader>
                                    {invitations.map((invitation) => (
                                        <ListItem
                                            key={invitation.id}
                                            divider
                                            sx={{
                                                px: 2.25,
                                                flexDirection: 'column',
                                                alignItems: 'stretch',
                                                gap: 0.5,
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-10 flex-none items-center justify-center rounded-full border border-dashed border-[var(--popup-muted)] text-sm font-bold text-[var(--popup-muted)]">
                                                    {getInitials(
                                                        invitation.name,
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center justify-between gap-2">
                                                        <span className="truncate font-bold text-[var(--popup-fg)]">
                                                            {invitation.name}
                                                        </span>
                                                        <InviteStatus
                                                            invitation={
                                                                invitation
                                                            }
                                                        />
                                                    </span>
                                                    <span className="block truncate text-xs text-[var(--popup-muted)]">
                                                        {roleLabel(
                                                            invitation.role,
                                                        )}{' '}
                                                        ·{' '}
                                                        {invitedAgo(invitation)}
                                                    </span>
                                                </span>
                                            </div>

                                            {/* Three equal buttons: short words on a phone */}
                                            <div className="grid grid-cols-3 gap-2 pt-2">
                                                <InviteAction
                                                    tone={
                                                        resend?.id ===
                                                            invitation.id &&
                                                        resend.state !==
                                                            'sending'
                                                            ? resend.state ===
                                                              'sent'
                                                                ? 'success'
                                                                : 'danger'
                                                            : 'default'
                                                    }
                                                    busy={
                                                        resend?.id ===
                                                            invitation.id &&
                                                        resend.state ===
                                                            'sending'
                                                    }
                                                    icon={
                                                        resend?.id ===
                                                            invitation.id &&
                                                        resend.state ===
                                                            'sent' ? (
                                                            <CheckIcon fontSize="inherit" />
                                                        ) : (
                                                            <SendIcon fontSize="inherit" />
                                                        )
                                                    }
                                                    onClick={() =>
                                                        resendInvite(invitation)
                                                    }
                                                >
                                                    {resend?.id ===
                                                    invitation.id ? (
                                                        resend.state ===
                                                        'sending' ? (
                                                            t('Sending…')
                                                        ) : resend.state ===
                                                          'sent' ? (
                                                            t('Sent')
                                                        ) : (
                                                            t('Failed')
                                                        )
                                                    ) : (
                                                        <ShortLabel
                                                            short={t('Resend')}
                                                            full={t(
                                                                'Send again',
                                                            )}
                                                        />
                                                    )}
                                                </InviteAction>
                                                <InviteAction
                                                    tone={
                                                        copiedId ===
                                                        invitation.id
                                                            ? 'success'
                                                            : 'default'
                                                    }
                                                    icon={
                                                        copiedId ===
                                                        invitation.id ? (
                                                            <CheckIcon fontSize="inherit" />
                                                        ) : (
                                                            <LinkIcon fontSize="inherit" />
                                                        )
                                                    }
                                                    onClick={(event) =>
                                                        copyLink(
                                                            invitation,
                                                            event.currentTarget,
                                                        )
                                                    }
                                                >
                                                    {copiedId ===
                                                    invitation.id ? (
                                                        t('Copied')
                                                    ) : (
                                                        <ShortLabel
                                                            short={t('Copy')}
                                                            full={t(
                                                                'Copy link',
                                                            )}
                                                        />
                                                    )}
                                                </InviteAction>
                                                <InviteAction
                                                    tone="danger"
                                                    icon={
                                                        <CloseIcon fontSize="inherit" />
                                                    }
                                                    onClick={() =>
                                                        cancelInvite(invitation)
                                                    }
                                                >
                                                    <ShortLabel
                                                        short={t('Cancel')}
                                                        full={t(
                                                            'Cancel invitation',
                                                        )}
                                                    />
                                                </InviteAction>
                                            </div>
                                            {shownLinkId === invitation.id && (
                                                <div className="flex flex-col gap-1 pt-1">
                                                    <input
                                                        readOnly
                                                        value={invitation.link}
                                                        aria-label={t(
                                                            'Invitation link',
                                                        )}
                                                        onFocus={(e) =>
                                                            e.currentTarget.select()
                                                        }
                                                        className="w-full rounded-lg border border-[var(--popup-border)] bg-transparent px-2.5 py-2 text-xs text-[var(--popup-fg)]"
                                                    />
                                                    <span className="text-xs text-[var(--popup-muted)]">
                                                        {t(
                                                            'Your browser didn’t allow copying. Tap the link, select it all and copy it.',
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </ListItem>
                                    ))}
                                </ul>
                            </li>
                        )}

                        {/* Deactivated accounts: folded away until asked for */}
                        {deactivated.length > 0 && (
                            <li>
                                <ul>
                                    <ListItemButton
                                        onClick={() =>
                                            setShowDeactivated(!showDeactivated)
                                        }
                                        aria-expanded={showDeactivated}
                                        sx={{
                                            px: 2.25,
                                            py: 1.25,
                                            color: 'var(--popup-muted)',
                                            fontSize: 14,
                                            fontWeight: 700,
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        {t('Deactivated (:count)', {
                                            count: deactivated.length,
                                        })}
                                        {showDeactivated ? (
                                            <ExpandLessIcon />
                                        ) : (
                                            <ExpandMoreIcon />
                                        )}
                                    </ListItemButton>
                                    {showDeactivated &&
                                        deactivated.map(personRow)}
                                </ul>
                            </li>
                        )}
                    </List>
                </DialogContent>

                <div className="flex gap-3 border-t border-[var(--popup-border)] px-4 py-3">
                    <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<PaymentsIcon />}
                        onClick={openSalaryEntry}
                        sx={{ whiteSpace: 'nowrap', px: 1.5 }}
                    >
                        <span className="sm:hidden">{t('Salary')}</span>
                        <span className="hidden sm:inline">
                            {t('Enter salary')}
                        </span>
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={<MailOutlineIcon />}
                        onClick={openInvite}
                        sx={{ whiteSpace: 'nowrap', px: 1.5 }}
                    >
                        <span className="sm:hidden">{t('Invite')}</span>
                        <span className="hidden sm:inline">
                            {t('Invite to the team')}
                        </span>
                    </Button>
                </div>
            </Dialog>

            {/* One person: what they do, and what can be done with them */}
            <Dialog
                open={!!person}
                onClose={() => setPerson(null)}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                {person && (
                    <>
                        <DialogTitle sx={{ p: 0 }}>
                            <PopupHeader
                                icon={<PersonIcon fontSize="small" />}
                                title={person.name}
                                subtitle={
                                    person.is_owner
                                        ? `${t('Owner')} · ${t('Admin')}`
                                        : roleLabel(person.role)
                                }
                                onClose={() => setPerson(null)}
                            />
                        </DialogTitle>
                        <DialogContent sx={{ px: 2.25 }}>
                            <div className="flex flex-col gap-4 pt-1 pb-2">
                                <PersonDetail label={t('Email')}>
                                    <a
                                        href={`mailto:${person.email}`}
                                        className="text-hydra-blue dark:text-sky-300"
                                    >
                                        {person.email}
                                    </a>
                                </PersonDetail>
                                {person.role === 'coach' && (
                                    <PersonDetail label={t('Groups')}>
                                        {coachGroupsLabel(person, groups)}
                                    </PersonDetail>
                                )}
                                <PersonDetail
                                    label={t('Salary for :month', { month })}
                                >
                                    {person.salary_this_month
                                        ? t('Recorded')
                                        : t('Not recorded yet')}
                                </PersonDetail>
                                {!person.active && (
                                    <PersonDetail label={t('Status')}>
                                        <span className="text-red-500">
                                            {describe(person)}
                                        </span>
                                    </PersonDetail>
                                )}

                                <div className="mt-1 flex flex-col gap-2">
                                    <Button
                                        variant="contained"
                                        startIcon={<PaymentsIcon />}
                                        onClick={() => {
                                            const member = person;
                                            setPerson(null);
                                            handleCoachClick(member);
                                        }}
                                    >
                                        {t('Salary history')}
                                    </Button>
                                    {/* The owner's details are changed only by the owner */}
                                    {(!person.is_owner || person.is_self) && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<EditIcon />}
                                            onClick={() => {
                                                const member = person;
                                                setPerson(null);
                                                handleEditOpen(member);
                                            }}
                                        >
                                            {t('Edit')}
                                        </Button>
                                    )}
                                    {!person.is_self &&
                                        !person.is_owner &&
                                        (person.active ? (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                startIcon={<BlockIcon />}
                                                onClick={() => {
                                                    const member = person;
                                                    setPerson(null);
                                                    setDeactivating(member);
                                                }}
                                            >
                                                {t('Deactivate')}
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outlined"
                                                color="success"
                                                startIcon={<LockOpenIcon />}
                                                onClick={() => {
                                                    const member = person;
                                                    setPerson(null);
                                                    setActive(member, true);
                                                }}
                                            >
                                                {t('Activate')}
                                            </Button>
                                        ))}
                                </div>
                            </div>
                        </DialogContent>
                    </>
                )}
            </Dialog>

            {/* Invite to the team: no passwords from the admin */}
            <Dialog
                open={inviting}
                onClose={() => setInviting(false)}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<MailOutlineIcon fontSize="small" />}
                        title={t('Invite to the team')}
                        subtitle={t('They get an email with a link')}
                        onClose={() => setInviting(false)}
                    />
                </DialogTitle>
                <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                    <form
                        onSubmit={sendInvite}
                        // Room above the first field for its floating label
                        className="flex flex-col gap-5 pt-3 pb-2"
                    >
                        <TextField
                            label={t('Full name')}
                            value={invite.name}
                            onChange={(e) =>
                                setInvite({ ...invite, name: e.target.value })
                            }
                            error={!!inviteErrors.name}
                            helperText={inviteErrors.name}
                            required
                            fullWidth
                            sx={FIELD_SX}
                        />
                        <TextField
                            label={t('Email')}
                            type="email"
                            value={invite.email}
                            onChange={(e) =>
                                setInvite({ ...invite, email: e.target.value })
                            }
                            error={!!inviteErrors.email}
                            helperText={inviteErrors.email}
                            required
                            fullWidth
                            sx={FIELD_SX}
                        />

                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-semibold text-[var(--popup-fg)]">
                                {t('Role')}
                            </span>
                            <RoleSwitch
                                value={invite.role}
                                onChange={(role) =>
                                    setInvite({ ...invite, role })
                                }
                            />
                            <p className="text-xs text-[var(--popup-muted)]">
                                {invite.role === 'coach'
                                    ? t(
                                          'A coach sees only their own groups, not the club’s money.',
                                      )
                                    : t(
                                          'An admin sees everything, including the money and the team.',
                                      )}
                            </p>
                        </div>

                        {/* Admins see every group: only a coach gets groups */}
                        {invite.role === 'coach' && (
                            <CoachGroupsField
                                id="invite-coach-groups"
                                groups={groups}
                                value={invite}
                                onChange={(value) =>
                                    setInvite({ ...invite, ...value })
                                }
                                error={
                                    inviteErrors.group_ids ??
                                    inviteErrors.all_groups
                                }
                            />
                        )}

                        <p className="text-xs text-[var(--popup-muted)]">
                            {t(
                                'The link works for 7 days. If the email doesn’t arrive, copy the link and send it by Viber.',
                            )}
                        </p>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outlined"
                                fullWidth
                                onClick={() => setInviting(false)}
                                sx={ONE_LINE_SX}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={
                                    sendingInvite ||
                                    (invite.role === 'coach' &&
                                        !invite.all_groups &&
                                        invite.group_ids.length === 0)
                                }
                                sx={ONE_LINE_SX}
                            >
                                {t('Send invitation')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {selectedCoach && (
                <Dialog
                    open={!!selectedCoach}
                    onClose={() => setSelectedCoach(null)}
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{
                        sx: { bgcolor: POPUP_BG },
                    }}
                >
                    <DialogTitle sx={{ p: 0 }}>
                        <PopupHeader
                            icon={<PaymentsIcon fontSize="small" />}
                            title={t('Salary history')}
                            subtitle={selectedCoach.name}
                            onClose={() => setSelectedCoach(null)}
                        />
                    </DialogTitle>

                    <DialogContent sx={{ overflowY: 'auto' }}>
                        <div className="flex flex-col gap-6 py-4">
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                {t('Payment History By Month')}
                            </Typography>

                            {loadingSalaries ? (
                                <CardsSkeleton cards={1} />
                            ) : currentYearLastSalary ? (
                                <List disablePadding>
                                    <ListItem
                                        divider
                                        sx={{
                                            px: 0,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: 'auto',
                                            gap: 2,
                                            paddingY: 1.5,
                                            alignItems: 'center',
                                            '&:hover': {
                                                bgcolor: popupFg(0.05),
                                            },
                                        }}
                                        onClick={() =>
                                            setShowSalaryHistoryModal(true)
                                        }
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '16px',
                                            }}
                                        >
                                            <Typography variant="body2">
                                                {dayjs(
                                                    currentYearLastSalary.month,
                                                ).format('MMMM YYYY')}
                                            </Typography>
                                            {currentYearSalaryMonths.length >
                                                1 && (
                                                <Typography
                                                    variant="caption"
                                                    color="primary"
                                                >
                                                    {tc(
                                                        ':count month|:count months',
                                                        currentYearSalaryMonths.length,
                                                    )}
                                                </Typography>
                                            )}
                                        </div>

                                        <Chip
                                            label={`${formatCurrency(currentYearLastSalary.total)} MKD`}
                                            color="success"
                                            size="small"
                                        />
                                        {/* Says plainly that the whole history opens from here */}
                                        <ShowHistoryButton
                                            label={t('View full history')}
                                            onClick={() =>
                                                setShowSalaryHistoryModal(true)
                                            }
                                        />
                                    </ListItem>
                                </List>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {t(
                                        'No salary payments recorded for :year.',
                                        {
                                            year: currentYear,
                                        },
                                    )}
                                </Typography>
                            )}

                            <Divider />

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                {t('Payment History By Year')}
                            </Typography>

                            {loadingSalaries ? (
                                <CardsSkeleton />
                            ) : sortedSalaryYears.length > 0 ? (
                                <List disablePadding>
                                    {sortedSalaryYears.map((year) => (
                                        <ListItem
                                            key={year}
                                            divider
                                            sx={{
                                                px: 0,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: 'auto',
                                                gap: 2,
                                                paddingY: 1.5,
                                                alignItems: 'center',
                                                '&:hover': {
                                                    bgcolor: popupFg(0.05),
                                                },
                                            }}
                                            onClick={() => {
                                                setSelectedSalaryYear(year);
                                                setShowSalaryYearDetailModal(
                                                    true,
                                                );
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                }}
                                            >
                                                <Typography variant="body2">
                                                    {year}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="primary"
                                                >
                                                    {tc(
                                                        ':count month|:count months',
                                                        salaryYearGroups[year]
                                                            .monthCount,
                                                    )}
                                                </Typography>
                                            </div>

                                            <Chip
                                                label={`${formatCurrency(
                                                    salaryYearGroups[year]
                                                        .total,
                                                )} MKD`}
                                                color="success"
                                                size="small"
                                            />
                                            {/* Says plainly that the whole history opens from here */}
                                            <ShowHistoryButton
                                                label={t('View months')}
                                                onClick={() => {
                                                    setSelectedSalaryYear(year);
                                                    setShowSalaryYearDetailModal(
                                                        true,
                                                    );
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {t('No past-year payment history yet.')}
                                </Typography>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <Dialog
                open={showSalaryHistoryModal}
                onClose={() => setShowSalaryHistoryModal(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: POPUP_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            {t('Payment History By Month — :name', {
                                name: selectedCoach?.name ?? '',
                            })}
                        </Typography>
                        <CloseButton
                            onClick={() => setShowSalaryHistoryModal(false)}
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {salaryRows(currentYearSalaryMonths)}
                </DialogContent>
            </Dialog>

            <Dialog
                open={showSalaryYearDetailModal}
                onClose={() => {
                    setShowSalaryYearDetailModal(false);
                    setSelectedSalaryYear(null);
                }}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: POPUP_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            {t('Payment History - :year — :name', {
                                year: selectedSalaryYear ?? '',
                                name: selectedCoach?.name ?? '',
                            })}
                        </Typography>
                        <CloseButton
                            onClick={() => {
                                setShowSalaryYearDetailModal(false);
                                setSelectedSalaryYear(null);
                            }}
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {salaryRows(salaryYearMonths)}
                </DialogContent>
            </Dialog>

            {/* Correct a salary (amount or month), or delete it */}
            <Dialog
                open={!!editingSalary}
                onClose={() => !editingSalary?.saving && setEditingSalary(null)}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<EditIcon fontSize="small" />}
                        title={t('Edit salary')}
                        subtitle={selectedCoach?.name}
                        onClose={() => setEditingSalary(null)}
                    />
                </DialogTitle>
                {editingSalary && (
                    <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                        {editingSalary.confirmingDelete ? (
                            <div className="flex flex-col gap-4 pt-3 pb-2">
                                <p className="text-sm text-[var(--popup-fg)]">
                                    {t(
                                        'Are you sure you want to delete this salary?',
                                    )}
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        disabled={editingSalary.saving}
                                        onClick={() =>
                                            setEditingSalary({
                                                ...editingSalary,
                                                confirmingDelete: false,
                                            })
                                        }
                                    >
                                        {t('Cancel')}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        fullWidth
                                        startIcon={<DeleteIcon />}
                                        disabled={editingSalary.saving}
                                        onClick={deleteSalary}
                                    >
                                        {t('Delete')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form
                                onSubmit={saveSalaryEdit}
                                // Room above the first field for its floating label
                                className="flex flex-col gap-5 pt-3 pb-2"
                            >
                                <TextField
                                    label={t('Amount (MKD)')}
                                    type="number"
                                    value={editingSalary.amount}
                                    onChange={(e) =>
                                        setEditingSalary({
                                            ...editingSalary,
                                            amount: e.target.value,
                                        })
                                    }
                                    error={!!editingSalary.errors.amount}
                                    helperText={editingSalary.errors.amount}
                                    required
                                    fullWidth
                                    slotProps={{
                                        htmlInput: {
                                            min: 0,
                                            inputMode: 'decimal',
                                        },
                                    }}
                                    sx={FIELD_SX}
                                />
                                <LocalizationProvider
                                    dateAdapter={AdapterDayjs}
                                    adapterLocale={locale}
                                    localeText={pickerLocaleText}
                                >
                                    <DatePicker
                                        label={t('Month')}
                                        value={editingSalary.month}
                                        onChange={(value) =>
                                            value &&
                                            setEditingSalary({
                                                ...editingSalary,
                                                month: value,
                                            })
                                        }
                                        views={['month', 'year']}
                                        sx={datePickerSx}
                                    />
                                </LocalizationProvider>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => setEditingSalary(null)}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={
                                            editingSalary.saving ||
                                            editingSalary.amount === ''
                                        }
                                    >
                                        {t('Save')}
                                    </Button>
                                </div>
                                <Button
                                    type="button"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() =>
                                        setEditingSalary({
                                            ...editingSalary,
                                            confirmingDelete: true,
                                        })
                                    }
                                >
                                    {t('Delete this salary')}
                                </Button>
                            </form>
                        )}
                    </DialogContent>
                )}
            </Dialog>

            {/* Asks before taking away someone's login */}
            <Dialog
                open={!!deactivating}
                onClose={() => setDeactivating(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <div className="flex flex-col gap-4 p-6">
                    <Typography variant="h6" fontWeight="bold">
                        {t('Deactivate :name?', {
                            name: deactivating?.name ?? '',
                        })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t(
                            "They won't be able to log in until you activate them again, and they are logged out now. Their trainings, salaries and history stay.",
                        )}
                    </Typography>
                    <div className="flex gap-3">
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => setDeactivating(null)}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            fullWidth
                            startIcon={<BlockIcon />}
                            onClick={() =>
                                deactivating && setActive(deactivating, false)
                            }
                        >
                            {t('Deactivate')}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Enter salary: pick the person, the amount and the month */}
            <Dialog
                open={!!salaryEntry}
                onClose={() => setSalaryEntry(null)}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<PaymentsIcon fontSize="small" />}
                        title={t('Enter salary')}
                        subtitle={t(
                            'Who still needs it this month comes first',
                        )}
                        onClose={() => setSalaryEntry(null)}
                    />
                </DialogTitle>
                {salaryEntry && (
                    <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                        <form
                            onSubmit={saveSalaryEntry}
                            // Room above the first field for its floating label
                            className="flex flex-col gap-5 pt-3 pb-2"
                        >
                            {salaryEntry.saved && (
                                <p className="flex items-center gap-2 rounded-xl bg-green-500/10 px-3 py-2 text-sm font-semibold text-green-600 dark:text-green-400">
                                    <CheckIcon fontSize="small" />
                                    {t('Salary for :name is recorded.', {
                                        name: salaryEntry.saved,
                                    })}
                                </p>
                            )}

                            <FormControl fullWidth required>
                                <InputLabel
                                    id="salary-person"
                                    sx={{ color: popupFg(0.5) }}
                                >
                                    {t('Staff member')}
                                </InputLabel>
                                <Select
                                    labelId="salary-person"
                                    label={t('Staff member')}
                                    value={salaryEntry.userId}
                                    onChange={(e) =>
                                        setSalaryEntry({
                                            ...salaryEntry,
                                            userId: Number(e.target.value),
                                            saved: null,
                                        })
                                    }
                                    sx={{
                                        color: POPUP_FG,
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: popupFg(0.3),
                                        },
                                        '& .MuiSvgIcon-root': {
                                            color: POPUP_FG,
                                        },
                                    }}
                                >
                                    {salaryPeople(staff, salaryEntry.month).map(
                                        (member) => (
                                            <MenuItem
                                                key={member.id}
                                                value={member.id}
                                            >
                                                <span className="flex w-full items-center justify-between gap-3">
                                                    <span className="truncate">
                                                        {member.name}
                                                    </span>
                                                    <span
                                                        className={`flex-none text-xs ${hasSalary(member, salaryEntry.month) ? 'text-green-600 dark:text-green-400' : 'text-[var(--popup-muted)]'}`}
                                                    >
                                                        {hasSalary(
                                                            member,
                                                            salaryEntry.month,
                                                        )
                                                            ? t('recorded')
                                                            : t('not recorded')}
                                                    </span>
                                                </span>
                                            </MenuItem>
                                        ),
                                    )}
                                </Select>
                            </FormControl>

                            <TextField
                                label={t('Amount (MKD)')}
                                type="number"
                                value={salaryEntry.amount}
                                onChange={(e) =>
                                    setSalaryEntry({
                                        ...salaryEntry,
                                        amount: e.target.value,
                                    })
                                }
                                error={!!salaryEntry.errors.amount}
                                helperText={salaryEntry.errors.amount}
                                required
                                fullWidth
                                slotProps={{
                                    htmlInput: { min: 0, inputMode: 'decimal' },
                                }}
                                sx={FIELD_SX}
                            />

                            <LocalizationProvider
                                dateAdapter={AdapterDayjs}
                                adapterLocale={locale}
                                localeText={pickerLocaleText}
                            >
                                <DatePicker
                                    label={t('Month')}
                                    value={salaryEntry.month}
                                    onChange={(value) =>
                                        value &&
                                        setSalaryEntry({
                                            ...salaryEntry,
                                            month: value,
                                        })
                                    }
                                    views={['month', 'year']}
                                    sx={datePickerSx}
                                />
                            </LocalizationProvider>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => setSalaryEntry(null)}
                                >
                                    {salaryEntry.saved
                                        ? t('Done')
                                        : t('Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    disabled={
                                        salaryEntry.saving ||
                                        salaryEntry.userId === '' ||
                                        salaryEntry.amount === ''
                                    }
                                >
                                    {t('Save')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                )}
            </Dialog>

            {/* Edit a staff member: name, email, a new password, a coach's groups */}
            <Dialog
                open={!!editingCoach}
                onClose={closeEdit}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<EditIcon fontSize="small" />}
                        title={t('Edit staff member')}
                        subtitle={editingCoach?.name}
                        onClose={closeEdit}
                    />
                </DialogTitle>

                <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                    <form
                        onSubmit={handleEditSubmit}
                        // Room above the first field for its floating label
                        className="flex flex-col gap-5 pt-3 pb-2"
                    >
                        <TextField
                            label={t('Full name')}
                            value={editForm.name}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    name: e.target.value,
                                })
                            }
                            error={!!editErrors.name}
                            helperText={editErrors.name}
                            required
                            fullWidth
                            sx={FIELD_SX}
                        />
                        <TextField
                            label={t('Email')}
                            type="email"
                            value={editForm.email}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    email: e.target.value,
                                })
                            }
                            error={!!editErrors.email}
                            helperText={editErrors.email}
                            required
                            fullWidth
                            sx={FIELD_SX}
                        />
                        <TextField
                            label={t('New password (optional)')}
                            type="password"
                            value={editForm.password}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    password: e.target.value,
                                })
                            }
                            error={!!editErrors.password}
                            helperText={
                                editErrors.password ??
                                t(
                                    'Leave empty to keep the current password. A new password logs the coach out on all devices.',
                                )
                            }
                            autoComplete="new-password"
                            slotProps={{ htmlInput: { minLength: 8 } }}
                            fullWidth
                            sx={FIELD_SX}
                        />
                        {editingCoach?.role === 'coach' && (
                            <CoachGroupsField
                                id="edit-coach-groups"
                                groups={groups}
                                value={editForm}
                                onChange={(value) =>
                                    setEditForm({ ...editForm, ...value })
                                }
                                error={
                                    editErrors.group_ids ??
                                    editErrors.all_groups
                                }
                            />
                        )}
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outlined"
                                fullWidth
                                onClick={closeEdit}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={
                                    editingCoach?.role === 'coach' &&
                                    !editForm.all_groups &&
                                    editForm.group_ids.length === 0
                                }
                            >
                                {t('Save')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
}

/** Waiting, expired, or the email couldn't be sent (then the link must be copied). */
function InviteStatus({ invitation }: { invitation: Invite }) {
    const [label, className] = invitation.email_failed
        ? [t('Not sent'), 'bg-red-500/15 text-red-600 dark:text-red-300']
        : invitation.expired
          ? [t('Expired'), 'bg-amber-500/15 text-amber-700 dark:text-amber-300']
          : [
                t('Waiting'),
                'bg-hydra-blue/15 text-hydra-blue dark:bg-sky-400/20 dark:text-sky-300',
            ];

    return (
        <span
            className={`flex-none rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
        >
            {label}
        </span>
    );
}

/** One of an invitation's three buttons: a small pill, a spinner while busy. */
function InviteAction({
    icon,
    tone = 'default',
    busy = false,
    onClick,
    children,
}: {
    icon?: ReactNode;
    tone?: 'default' | 'success' | 'danger';
    busy?: boolean;
    onClick: (event: MouseEvent<HTMLButtonElement>) => void;
    children: ReactNode;
}) {
    const colors = {
        default:
            'border-hydra-blue/40 text-hydra-blue hover:bg-hydra-blue/10 dark:border-sky-300/40 dark:text-sky-300',
        success:
            'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400',
        danger: 'border-red-500/40 text-red-500 hover:bg-red-500/10',
    }[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={busy}
            aria-busy={busy}
            className={`flex min-h-7 min-w-0 cursor-pointer items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition active:scale-95 disabled:cursor-wait sm:min-h-9 sm:gap-1.5 sm:text-[13px] ${colors}`}
        >
            <span className="flex flex-none text-sm sm:text-base">
                {busy ? <CircularProgress size={14} color="inherit" /> : icon}
            </span>
            <span className="truncate">{children}</span>
        </button>
    );
}

/** A short word on a phone, the full words from tablet width up. */
function ShortLabel({ short, full }: { short: string; full: string }) {
    return (
        <>
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{full}</span>
        </>
    );
}

/** A label with its value under it, on a person's card. */
function PersonDetail({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div>
            <p className="text-xs text-[var(--popup-muted)]">{label}</p>
            <p className="text-[15px] text-[var(--popup-fg)]">{children}</p>
        </div>
    );
}

/** Admin or coach, as two halves of one pill. */
function RoleSwitch({
    value,
    onChange,
}: {
    value: Role;
    onChange: (role: Role) => void;
}) {
    const option = (role: Role, label: string) => (
        <button
            type="button"
            role="radio"
            aria-checked={value === role}
            onClick={() => onChange(role)}
            className={`min-h-10 flex-1 cursor-pointer rounded-full text-sm font-bold transition ${
                value === role
                    ? 'bg-[var(--popup-bg)] text-[var(--popup-fg)] shadow-[0_1px_4px_rgba(0,16,49,0.18)]'
                    : 'text-[var(--popup-muted)] hover:text-[var(--popup-fg)]'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div
            role="radiogroup"
            aria-label={t('Role')}
            className="flex gap-1 rounded-full bg-[var(--popup-ghost)] p-1"
        >
            {option('admin', t('Admin'))}
            {option('coach', t('Coach'))}
        </div>
    );
}
