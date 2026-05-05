import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { ApiValidationError, apiRequest } from '@/lib/api';
import { disable, enable } from '@/routes/two-factor';

type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

type SecurityResponse = {
    canManageTwoFactor: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function Security({
    canManageTwoFactor: initialCanManageTwoFactor = false,
    requiresConfirmation: initialRequiresConfirmation = false,
    twoFactorEnabled: initialTwoFactorEnabled = false,
}: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const [canManageTwoFactor, setCanManageTwoFactor] = useState(
        initialCanManageTwoFactor,
    );
    const [requiresConfirmation, setRequiresConfirmation] = useState(
        initialRequiresConfirmation,
    );
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(
        initialTwoFactorEnabled,
    );
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<
        Record<string, string[]>
    >({});
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordRecentlySaved, setPasswordRecentlySaved] = useState(false);

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        const loadSecurity = async () => {
            try {
                const data = await apiRequest<SecurityResponse>(
                    '/api/settings/security',
                );

                setCanManageTwoFactor(data.canManageTwoFactor);
                setRequiresConfirmation(data.requiresConfirmation ?? false);
                setTwoFactorEnabled(data.twoFactorEnabled ?? false);
            } catch {
                // Keep the initial page state if the security metadata fails to refresh.
            }
        };

        void loadSecurity();
    }, []);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSavingPassword(true);
        setPasswordRecentlySaved(false);
        setPasswordError(null);
        setPasswordErrors({});

        try {
            await apiRequest<{ message: string }>('/api/settings/password', {
                method: 'PUT',
                body: passwordForm,
            });

            setPasswordForm({
                current_password: '',
                password: '',
                password_confirmation: '',
            });
            setPasswordRecentlySaved(true);
            window.setTimeout(() => setPasswordRecentlySaved(false), 2000);
        } catch (error) {
            if (error instanceof ApiValidationError) {
                setPasswordErrors(error.errors);
                setPasswordError(error.message);

                if (error.errors.password) {
                    passwordInput.current?.focus();
                }

                if (error.errors.current_password) {
                    currentPasswordInput.current?.focus();
                }

                return;
            }

            setPasswordError('Unable to update password. Please try again.');
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Update password"
                    description="Ensure your account is using a long, random password to stay secure"
                />

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="current_password">
                            Current password
                        </Label>

                        <PasswordInput
                            id="current_password"
                            ref={currentPasswordInput}
                            name="current_password"
                            className="mt-1 block w-full"
                            autoComplete="current-password"
                            placeholder="Current password"
                            value={passwordForm.current_password}
                            onChange={(event) =>
                                setPasswordForm({
                                    ...passwordForm,
                                    current_password: event.target.value,
                                })
                            }
                        />

                        <InputError
                            message={passwordErrors.current_password?.[0]}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">New password</Label>

                        <PasswordInput
                            id="password"
                            ref={passwordInput}
                            name="password"
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            placeholder="New password"
                            value={passwordForm.password}
                            onChange={(event) =>
                                setPasswordForm({
                                    ...passwordForm,
                                    password: event.target.value,
                                })
                            }
                        />

                        <InputError message={passwordErrors.password?.[0]} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm password
                        </Label>

                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            placeholder="Confirm password"
                            value={passwordForm.password_confirmation}
                            onChange={(event) =>
                                setPasswordForm({
                                    ...passwordForm,
                                    password_confirmation: event.target.value,
                                })
                            }
                        />

                        <InputError
                            message={passwordErrors.password_confirmation?.[0]}
                        />
                    </div>

                    {passwordError && (
                        <p className="text-sm text-red-600">{passwordError}</p>
                    )}

                    <div className="flex items-center gap-4">
                        <Button
                            disabled={isSavingPassword}
                            data-test="update-password-button"
                        >
                            Save password
                        </Button>

                        <Transition
                            show={passwordRecentlySaved}
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

            {canManageTwoFactor && (
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Two-factor authentication"
                        description="Manage your two-factor authentication settings"
                    />
                    {twoFactorEnabled ? (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <p className="text-sm text-muted-foreground">
                                You will be prompted for a secure, random pin
                                during login, which you can retrieve from the
                                TOTP-supported application on your phone.
                            </p>

                            <div className="relative inline">
                                <Form {...disable.form()}>
                                    {({ processing }) => (
                                        <Button
                                            variant="destructive"
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Disable 2FA
                                        </Button>
                                    )}
                                </Form>
                            </div>

                            <TwoFactorRecoveryCodes
                                recoveryCodesList={recoveryCodesList}
                                fetchRecoveryCodes={fetchRecoveryCodes}
                                errors={errors}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <p className="text-sm text-muted-foreground">
                                When you enable two-factor authentication, you
                                will be prompted for a secure pin during login.
                                This pin can be retrieved from a TOTP-supported
                                application on your phone.
                            </p>

                            <div>
                                {hasSetupData ? (
                                    <Button
                                        onClick={() => setShowSetupModal(true)}
                                    >
                                        <ShieldCheck />
                                        Continue setup
                                    </Button>
                                ) : (
                                    <Form
                                        {...enable.form()}
                                        onSuccess={() =>
                                            setShowSetupModal(true)
                                        }
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                Enable 2FA
                                            </Button>
                                        )}
                                    </Form>
                                )}
                            </div>
                        </div>
                    )}

                    <TwoFactorSetupModal
                        isOpen={showSetupModal}
                        onClose={() => setShowSetupModal(false)}
                        requiresConfirmation={requiresConfirmation}
                        twoFactorEnabled={twoFactorEnabled}
                        qrCodeSvg={qrCodeSvg}
                        manualSetupKey={manualSetupKey}
                        clearSetupData={clearSetupData}
                        fetchSetupData={fetchSetupData}
                        errors={errors}
                    />
                </div>
            )}
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: '/settings/security',
        },
    ],
};
