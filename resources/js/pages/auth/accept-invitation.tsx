import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/lib/i18n';

type Props = {
    /** None: the link has expired, was cancelled or was already used. */
    invitation: {
        name: string;
        email: string;
        role: 'admin' | 'coach';
        club: string;
    } | null;
    token: string | null;
};

/**
 * Where an invitation link leads: the invited person sets their own password and
 * is logged in. A link that no longer works says what to do instead.
 */
export default function AcceptInvitation({ invitation, token }: Props) {
    if (!invitation || !token) {
        return (
            <>
                <Head title={t('Invitation')} />
                <div className="grid gap-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        {t(
                            'This invitation link no longer works: it has expired, was cancelled or was already used. Ask your club’s admin to send you a new one.',
                        )}
                    </p>
                    <Button asChild className="w-full">
                        <Link href="/login">{t('Go to log in')}</Link>
                    </Button>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={t('Invitation')} />

            <Form
                action={`/invitation/${token}`}
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <p className="text-center text-sm">
                            {t(':club invited you as :role.', {
                                club: invitation.club,
                                role:
                                    invitation.role === 'admin'
                                        ? t('an admin')
                                        : t('a coach'),
                            })}{' '}
                            {t('Set your password to start.')}
                        </p>

                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('Full name')}</Label>
                            <Input
                                id="name"
                                value={invitation.name}
                                readOnly
                                className="mt-1 block w-full"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('Email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="username"
                                value={invitation.email}
                                readOnly
                                className="mt-1 block w-full"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">{t('Password')}</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                required
                                placeholder={t('Password')}
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
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                required
                                placeholder={t('Confirm password')}
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            {t('Accept the invitation')}
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

AcceptInvitation.layout = {
    title: 'Join your club',
    description: 'Set a password for your new account',
};
