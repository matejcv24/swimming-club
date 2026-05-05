import { Transition } from '@headlessui/react';
import { Head, Link, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiValidationError, apiRequest } from '@/lib/api';
import { send } from '@/routes/verification';
import type { User } from '@/types';

type ProfileResponse = {
    user: User;
    mustVerifyEmail: boolean;
    status?: string;
};

type UpdateProfileResponse = {
    message: string;
    user: User;
};

export default function Profile({
    mustVerifyEmail: initialMustVerifyEmail = false,
    status: initialStatus,
}: {
    mustVerifyEmail?: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const [profileUser, setProfileUser] = useState(auth.user);
    const [mustVerifyEmail, setMustVerifyEmail] = useState(
        initialMustVerifyEmail,
    );
    const [status, setStatus] = useState(initialStatus);
    const [form, setForm] = useState({
        name: auth.user.name,
        email: auth.user.email,
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            setProfileError(null);

            try {
                const data = await apiRequest<ProfileResponse>(
                    '/api/settings/profile',
                );

                setProfileUser(data.user);
                setMustVerifyEmail(data.mustVerifyEmail);
                setStatus(data.status);
                setForm({
                    name: data.user.name,
                    email: data.user.email,
                });
            } catch {
                setProfileError('Unable to refresh profile data.');
            }
        };

        void loadProfile();
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        setRecentlySuccessful(false);
        setProfileError(null);
        setErrors({});

        try {
            const data = await apiRequest<UpdateProfileResponse>(
                '/api/settings/profile',
                {
                    method: 'PATCH',
                    body: form,
                },
            );

            setProfileUser(data.user);
            setRecentlySuccessful(true);
            window.setTimeout(() => setRecentlySuccessful(false), 2000);
        } catch (error) {
            if (error instanceof ApiValidationError) {
                setErrors(error.errors);
                setProfileError(error.message);

                return;
            }

            setProfileError('Unable to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile information"
                    description="Update your name and email address"
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>

                        <Input
                            id="name"
                            className="mt-1 block w-full"
                            value={form.name}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    name: event.target.value,
                                })
                            }
                            name="name"
                            required
                            autoComplete="name"
                            placeholder="Full name"
                        />

                        <InputError
                            className="mt-2"
                            message={errors.name?.[0]}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>

                        <Input
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            value={form.email}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    email: event.target.value,
                                })
                            }
                            name="email"
                            required
                            autoComplete="username"
                            placeholder="Email address"
                        />

                        <InputError
                            className="mt-2"
                            message={errors.email?.[0]}
                        />
                    </div>

                    {mustVerifyEmail &&
                        profileUser.email_verified_at === null && (
                            <div>
                                <p className="-mt-4 text-sm text-muted-foreground">
                                    Your email address is unverified.{' '}
                                    <Link
                                        href={send()}
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Click here to resend the verification
                                        email.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to
                                        your email address.
                                    </div>
                                )}
                            </div>
                        )}

                    {profileError && (
                        <p className="text-sm text-red-600">{profileError}</p>
                    )}

                    <div className="flex items-center gap-4">
                        <Button
                            disabled={isSaving}
                            data-test="update-profile-button"
                        >
                            Save
                        </Button>

                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-neutral-600">Saved</p>
                        </Transition>
                    </div>
                </form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: '/settings/profile',
        },
    ],
};
