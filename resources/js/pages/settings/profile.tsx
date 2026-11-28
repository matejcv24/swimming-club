import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import LockIcon from '@mui/icons-material/Lock';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { MuiThemeProvider } from '@/components/mui-theme-provider';
import { FIELD_SX, IconBadge, Note } from '@/components/popup-ui';
import { t } from '@/lib/i18n';
import { showToast } from '@/lib/toast';
import { send } from '@/routes/verification';
import type { ClubSharedData } from '@/types/club';

type NotificationSettings = Record<string, boolean>;

/** Each kind of notification an admin can turn off, in the bell's words. */
const NOTIFICATION_KINDS: { type: string; label: string }[] = [
    { type: 'member_changed', label: 'Members added or changed by coaches' },
    { type: 'training_attendance', label: 'Attendance recorded' },
    { type: 'membership_payment', label: 'Membership payments' },
    { type: 'staff_joined', label: 'Someone joined the team' },
];

export default function Profile({
    mustVerifyEmail,
    status,
    notificationSettings,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    notificationSettings: NotificationSettings | null;
}) {
    const { auth } = usePage().props;
    const isAdmin = (auth.user as { role?: string }).role === 'admin';

    return (
        <MuiThemeProvider>
            <Head title={t('Account settings')} />

            <h1 className="sr-only">{t('Account settings')}</h1>

            <div className="flex flex-col gap-4">
                <ProfileCard
                    mustVerifyEmail={mustVerifyEmail}
                    status={status}
                />
                <PasswordCard />
                {isAdmin && <EmailsCard />}
                {notificationSettings && (
                    <NotificationsCard settings={notificationSettings} />
                )}
            </div>
        </MuiThemeProvider>
    );
}

/** A section of the page, in the same frame as the app's pop-ups. */
function Card({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: ReactNode;
    title: string;
    subtitle: string;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-[20px] border border-[var(--popup-border)] bg-[var(--popup-bg)] text-[var(--popup-fg)]">
            <div className="flex items-center gap-3 px-[18px] pt-[18px] pb-3.5">
                <IconBadge>{icon}</IconBadge>
                <div className="min-w-0">
                    <h2 className="text-[17px] leading-tight font-extrabold">
                        {title}
                    </h2>
                    <p className="mt-0.5 text-[12.5px] text-[var(--popup-muted)]">
                        {subtitle}
                    </p>
                </div>
            </div>
            {children}
        </section>
    );
}

function ProfileCard({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const form = useForm({ name: auth.user.name, email: auth.user.email });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.patch('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => showToast(t('Your name and email were saved')),
        });
    };

    const unchanged =
        form.data.name === auth.user.name &&
        form.data.email === auth.user.email;

    return (
        <Card
            icon={<PersonIcon fontSize="small" />}
            title={t('Name and email')}
            subtitle={t('Update your name and email address')}
        >
            <form
                onSubmit={submit}
                className="flex flex-col gap-5 px-[18px] pt-2 pb-[18px]"
            >
                <TextField
                    label={t('Name')}
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    error={!!form.errors.name}
                    helperText={form.errors.name}
                    required
                    fullWidth
                    autoComplete="name"
                    sx={FIELD_SX}
                />
                <TextField
                    label={t('Email address')}
                    type="email"
                    value={form.data.email}
                    onChange={(e) => form.setData('email', e.target.value)}
                    error={!!form.errors.email}
                    helperText={form.errors.email}
                    required
                    fullWidth
                    autoComplete="username"
                    sx={FIELD_SX}
                />

                {mustVerifyEmail && auth.user.email_verified_at === null && (
                    <Note tone="warn">
                        {t('Your email address is unverified.')}{' '}
                        <Link
                            href={send()}
                            as="button"
                            className="cursor-pointer font-semibold underline underline-offset-4"
                        >
                            {t('Click here to resend the verification email.')}
                        </Link>
                        {status === 'verification-link-sent' && (
                            <span className="mt-1 block font-semibold">
                                {t(
                                    'A new verification link has been sent to your email address.',
                                )}
                            </span>
                        )}
                    </Note>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={form.processing || unchanged}
                    data-test="update-profile-button"
                >
                    {t('Save')}
                </Button>
            </form>
        </Card>
    );
}

function PasswordCard() {
    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                showToast(t('Your password was changed'));
            },
            onError: () =>
                form.reset('password', 'password_confirmation', 'current_password'),
        });
    };

    const field = (
        name: 'current_password' | 'password' | 'password_confirmation',
        label: string,
        autoComplete: string,
    ) => (
        <TextField
            label={label}
            type="password"
            value={form.data[name]}
            onChange={(e) => form.setData(name, e.target.value)}
            error={!!form.errors[name]}
            helperText={form.errors[name]}
            fullWidth
            autoComplete={autoComplete}
            sx={FIELD_SX}
        />
    );

    return (
        <Card
            icon={<LockIcon fontSize="small" />}
            title={t('Change password')}
            subtitle={t('At least 8 characters')}
        >
            <form
                onSubmit={submit}
                className="flex flex-col gap-5 px-[18px] pt-2 pb-[18px]"
            >
                {field(
                    'current_password',
                    t('Current password'),
                    'current-password',
                )}
                {field('password', t('New password'), 'new-password')}
                {field(
                    'password_confirmation',
                    t('Confirm password'),
                    'new-password',
                )}
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={
                        form.processing ||
                        !form.data.current_password ||
                        !form.data.password
                    }
                    data-test="update-password-button"
                >
                    {t('Save')}
                </Button>
            </form>
        </Card>
    );
}

type EmailSwitchKey =
    | 'payment_confirmation_emails'
    | 'auto_payment_confirmation'
    | 'payment_reminder_emails'
    | 'auto_payment_reminder';

/**
 * Admins: the emails the club sends to parents, and whether they go out by
 * themselves. Each switch is saved as soon as it is flipped.
 */
function EmailsCard() {
    const { club } = usePage().props as { club: ClubSharedData | null };
    const [values, setValues] = useState<Record<EmailSwitchKey, boolean>>({
        payment_confirmation_emails: club?.payment_confirmation_emails ?? true,
        auto_payment_confirmation: club?.auto_payment_confirmation ?? false,
        payment_reminder_emails: club?.payment_reminder_emails ?? true,
        auto_payment_reminder: club?.auto_payment_reminder ?? false,
    });

    const toggle = (key: EmailSwitchKey) => {
        const before = values;
        const next = { ...values, [key]: !values[key] };
        setValues(next);
        router.patch(
            '/club/emails',
            { [key]: next[key] },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => showToast(t('The email settings were saved')),
                onError: () => setValues(before),
            },
        );
    };

    return (
        <Card
            icon={<MailOutlineIcon fontSize="small" />}
            title={t('Emails')}
            subtitle={t('For the whole club: every admin sees the same')}
        >
            <ul className="border-t border-[var(--popup-border)]">
                <SwitchRow
                    label={t('Payment confirmation')}
                    checked={values.payment_confirmation_emails}
                    onChange={() => toggle('payment_confirmation_emails')}
                />
                <SwitchRow
                    indented
                    label={t('Send automatically')}
                    checked={
                        values.payment_confirmation_emails &&
                        values.auto_payment_confirmation
                    }
                    disabled={!values.payment_confirmation_emails}
                    onChange={() => toggle('auto_payment_confirmation')}
                />
                <SwitchRow
                    label={t('Reminder for an unpaid fee')}
                    checked={values.payment_reminder_emails}
                    onChange={() => toggle('payment_reminder_emails')}
                />
                <SwitchRow
                    indented
                    label={t('Send automatically')}
                    checked={
                        values.payment_reminder_emails &&
                        values.auto_payment_reminder
                    }
                    disabled={!values.payment_reminder_emails}
                    onChange={() => toggle('auto_payment_reminder')}
                />
            </ul>
        </Card>
    );
}

/** A setting with a short explanation and its switch; "automatic" ones indented. */
function SwitchRow({
    label,
    checked,
    disabled = false,
    indented = false,
    onChange,
}: {
    label: string;
    checked: boolean;
    disabled?: boolean;
    indented?: boolean;
    onChange: () => void;
}) {
    return (
        <li className="border-b border-[var(--popup-border)] last:border-b-0">
            <label
                className={`relative flex min-h-12 items-center gap-3 py-2 pr-[18px] ${indented ? 'pl-11' : 'pl-[18px]'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
            >
                {indented && (
                    <span
                        aria-hidden
                        className="absolute inset-y-0 left-7 border-l-2 border-[var(--popup-border)]"
                    />
                )}
                <span
                    className={`min-w-0 flex-1 font-semibold ${indented ? 'text-sm' : 'text-[15px]'}`}
                >
                    {label}
                </span>
                <Switch
                    checked={checked}
                    disabled={disabled}
                    onChange={onChange}
                    inputProps={{ 'aria-label': label }}
                />
            </label>
        </li>
    );
}

/** Admins: which notifications they get (in the bell and as pushes). */
function NotificationsCard({ settings }: { settings: NotificationSettings }) {
    const [values, setValues] = useState(settings);

    const toggle = (type: string) => {
        const before = values;
        const next = { ...values, [type]: !values[type] };
        setValues(next);
        router.patch('/settings/notifications', next, {
            preserveScroll: true,
            preserveState: true,
            onError: () => setValues(before),
        });
    };

    return (
        <Card
            icon={<NotificationsIcon fontSize="small" />}
            title={t('Which notifications I get')}
            subtitle={t('In the bell and as notifications on your devices')}
        >
            <ul className="border-t border-[var(--popup-border)]">
                {NOTIFICATION_KINDS.map(({ type, label }) => (
                    <li
                        key={type}
                        className="border-b border-[var(--popup-border)] last:border-b-0"
                    >
                        <label className="flex min-h-12 cursor-pointer items-center gap-3 px-[18px] py-1.5">
                            <span className="flex-1 text-[15px] font-semibold">
                                {t(label)}
                            </span>
                            <Switch
                                checked={!!values[type]}
                                onChange={() => toggle(type)}
                                inputProps={{ 'aria-label': t(label) }}
                            />
                        </label>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: t('Account settings'),
            href: '/settings/profile',
        },
    ],
};
