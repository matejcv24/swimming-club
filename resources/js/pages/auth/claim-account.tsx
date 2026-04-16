import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    parentName: string;
    parentEmail: string;
    parentId: number;
    signature: string;
    expires: string;
}

export default function ClaimAccount({
    parentName,
    parentEmail,
    parentId,
    signature,
    expires,
}: Props) {
    const [form, setForm] = useState({
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            `/claim-account/${parentId}?expires=${expires}&signature=${signature}`,
            form,
            {
                onError: (errors) => setErrors(errors),
            },
        );
    };
    1;

    return (
        <>
            <Head title="Activate Your Account" />
            <div className="flex min-h-screen items-center justify-center bg-background p-6">
                <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold">
                            Welcome, {parentName}!
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Set your password to activate your account and track
                            your child's progress.
                        </p>
                    </div>

                    <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-neutral-800">
                        <p className="text-sm text-gray-500">
                            Your email address
                        </p>
                        <p className="font-medium">{parentEmail}</p>
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
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.password}
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
                            {errors.password_confirmation && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary mt-2 w-full"
                        >
                            Activate My Account
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
