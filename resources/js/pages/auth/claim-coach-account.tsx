import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { ApiValidationError, apiRequest } from '@/lib/api';

interface Props {
    coachName: string;
    coachEmail: string;
    coachId: number;
    claimUrl: string;
}

interface ClaimCoachAccountResponse {
    redirect: string;
}

export default function ClaimCoachAccount({
    coachName,
    coachEmail,
    claimUrl,
}: Props) {
    const [form, setForm] = useState({
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [claimError, setClaimError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setClaimError(null);
        setIsSubmitting(true);

        try {
            const data = await apiRequest<ClaimCoachAccountResponse>(claimUrl, {
                method: 'POST',
                body: form,
            });

            router.visit(data.redirect);
        } catch (error) {
            if (error instanceof ApiValidationError) {
                setErrors(error.errors);
                setClaimError(error.message);

                return;
            }

            setClaimError(
                error instanceof Error
                    ? error.message
                    : 'Unable to activate account. Please try again.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Head title="Activate Your Coach Account" />
            <div className="flex min-h-screen items-center justify-center bg-background p-6">
                <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold">
                            Welcome, {coachName}!
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Set your password to activate your coach account.
                        </p>
                    </div>

                    <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-neutral-800">
                        <p className="text-sm text-gray-500">
                            Your email address
                        </p>
                        <p className="font-medium">{coachEmail}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label text-sm font-medium">
                                Password
                            </label>
                            <input
                                type="password"
                                className="input input-bordered w-full"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        password: e.target.value,
                                    })
                                }
                                required
                            />
                            {errors.password?.[0] && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.password[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="label text-sm font-medium">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                className="input input-bordered w-full"
                                placeholder="Confirm your password"
                                value={form.password_confirmation}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        password_confirmation: e.target.value,
                                    })
                                }
                                required
                            />
                            {errors.password_confirmation?.[0] && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.password_confirmation[0]}
                                </p>
                            )}
                        </div>

                        {claimError && (
                            <p className="text-sm text-red-500">{claimError}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary mt-2 w-full"
                        >
                            {isSubmitting
                                ? 'Activating...'
                                : 'Activate My Account'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
