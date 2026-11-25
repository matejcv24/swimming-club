import { Transition } from '@headlessui/react';
import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';
import { send } from '@/routes/verification';

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

    return (
        <>
            <Head title={t('Account settings')} />

            <h1 className="sr-only">{t('Account settings')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('Name and email')}
                    description={t('Update your name and email address')}
                />

                <Form
                    action="/settings/profile"
                    method="patch"
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, recentlySuccessful, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('Name')}</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder={t('Full name')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    {t('Email address')}
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder={t('Email address')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            {t(
                                                'Your email address is unverified.',
                                            )}{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                {t(
                                                    'Click here to resend the verification email.',
                                                )}
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                {t(
                                                    'A new verification link has been sent to your email address.',
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    {t('Save')}
                                </Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-neutral-600">
                                        {t('Saved')}
                                    </p>
                                </Transition>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <PasswordSection />

            {notificationSettings && (
                <NotificationsSection settings={notificationSettings} />
            )}
        </>
    );
}

function PasswordSection() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title={t('Change password')}
                description={t('At least 8 characters')}
            />

            <Form
                action="/settings/password"
                method="put"
                options={{ preserveScroll: true }}
                resetOnError={[
                    'password',
                    'password_confirmation',
                    'current_password',
                ]}
                resetOnSuccess
                onError={(errors) => {
                    if (errors.password) {
                        passwordInput.current?.focus();
                    }

                    if (errors.current_password) {
                        currentPasswordInput.current?.focus();
                    }
                }}
                className="space-y-6"
            >
                {({ errors, processing, recentlySuccessful }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">
                                {t('Current password')}
                            </Label>
                            <PasswordInput
                                id="current_password"
                                ref={currentPasswordInput}
                                name="current_password"
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                placeholder={t('Current password')}
                            />
                            <InputError message={errors.current_password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                {t('New password')}
                            </Label>
                            <PasswordInput
                                id="password"
                                ref={passwordInput}
                                name="password"
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                placeholder={t('New password')}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                {t('Confirm password')}
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                placeholder={t('Confirm password')}
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                disabled={processing}
                                data-test="update-password-button"
                            >
                                {t('Save password')}
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">
                                    {t('Saved')}
                                </p>
                            </Transition>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
}

/** Admins: which notifications they get (in the bell and as pushes). */
function NotificationsSection({
    settings,
}: {
    settings: NotificationSettings;
}) {
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
        <div className="space-y-4">
            <Heading
                variant="small"
                title={t('Which notifications I get')}
                description={t(
                    'In the bell and as notifications on your devices',
                )}
            />

            <div className="divide-y rounded-xl border">
                {NOTIFICATION_KINDS.map(({ type, label }) => (
                    <button
                        key={type}
                        type="button"
                        role="switch"
                        aria-checked={values[type]}
                        onClick={() => toggle(type)}
                        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm"
                    >
                        <span className="flex-1">{t(label)}</span>
                        <span
                            aria-hidden="true"
                            className={`relative h-5 w-9 flex-none rounded-full transition-colors ${
                                values[type]
                                    ? 'bg-hydra-blue'
                                    : 'bg-muted-foreground/30'
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${
                                    values[type] ? 'left-[18px]' : 'left-0.5'
                                }`}
                            />
                        </span>
                    </button>
                ))}
            </div>
        </div>
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
