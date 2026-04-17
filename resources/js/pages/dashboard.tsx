import { Head, router } from '@inertiajs/react';

interface Props {
    totalMembers?: number;
    unpaidFees?: number;
}

export default function Dashboard({
    totalMembers = 0,
    unpaidFees = 0,
}: Props) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <h1 className="text-2xl font-bold">Swimming Club Dashboard</h1>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:bg-neutral-900">
                        <p className="text-sm text-gray-500">Total Members</p>
                        <p className="mt-2 text-4xl font-bold">{totalMembers}</p>
                    </div>

                    <button
                        onClick={() => router.visit('/invoices')}
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-left transition-colors"
                    >
                        <p className="text-sm text-gray-500">Invoices</p>
                        <p className="mt-2 text-4xl font-bold">📄</p>
                    </button>

                    <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:bg-neutral-900">
                        <p className="text-sm text-gray-500">Unpaid Fees</p>
                        <p className="mt-2 text-4xl font-bold text-red-500">{unpaidFees}</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <a
                        href="/members"
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <h2 className="text-lg font-semibold">Members</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Member management is coming in the next milestone.
                        </p>
                    </a>

                    <a
                        href="/trainings"
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <h2 className="text-lg font-semibold">Trainings</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Training tracking is coming in a later milestone.
                        </p>
                    </a>

                    <a
                        href="/staff"
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <h2 className="text-lg font-semibold">Staff</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Staff management is coming in a later milestone.
                        </p>
                    </a>

                    <a
                        href="/membership-fees"
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <h2 className="text-lg font-semibold">Membership Fees</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Payment tracking is coming in a later milestone.
                        </p>
                    </a>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
