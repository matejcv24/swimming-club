import { Head, router } from '@inertiajs/react';

interface Props {
    userRole?: 'admin' | 'coach';
    activeMembers?: number;
    profitTotal?: number;
    unpaidFees?: number;
    invoiceTotal?: number;
}

export default function Dashboard({
    userRole = 'admin',
    activeMembers = 0,
    profitTotal = 0,
    unpaidFees = 0,
    invoiceTotal = 0,
}: Props) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <h1 className="text-2xl font-bold">Swimming Club Hydra</h1>

                <div className="grid gap-4 md:grid-cols-3">
                    {userRole === 'admin' && (
                        <button
                            onClick={() => router.visit('/profit')}
                            className="cursor-pointer rounded-xl border border-sidebar-border/70 bg-white p-6 text-left shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-lg dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        >
                            <p className="text-sm text-gray-500">Profit</p>
                            <p className="mt-2 text-4xl font-bold">
                                {profitTotal.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                MKD
                            </p>
                        </button>
                    )}

                    {userRole === 'admin' && (
                        <button
                            onClick={() => router.visit('/invoices')}
                            className="cursor-pointer rounded-xl border border-sidebar-border/70 bg-white p-6 text-left shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-lg dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        >
                            <p className="text-sm text-gray-500">Invoices</p>
                            <p className="mt-2 text-4xl font-bold">
                                {invoiceTotal.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                MKD
                            </p>
                        </button>
                    )}

                    <button
                        onClick={() => router.visit('/unpaid-fees')}
                        className="cursor-pointer rounded-xl border border-sidebar-border/70 bg-white p-6 text-left shadow-sm transition duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-lg dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <p className="text-sm text-gray-500">Unpaid Fees</p>
                        <p className="mt-2 text-4xl font-bold text-red-500">
                            {unpaidFees}
                        </p>
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <a
                        href="/members"
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <h2 className="text-lg font-semibold">Members</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Total active members: {activeMembers}
                        </p>
                    </a>

                    <a
                        href="/trainings"
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <h2 className="text-lg font-semibold">Trainings</h2>
                    </a>

                    <a
                        href="/membership-fees"
                        className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                        <h2 className="text-lg font-semibold">
                            Membership Fees
                        </h2>
                    </a>

                    {userRole === 'admin' && (
                        <a
                            href="/staff"
                            className="rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        >
                            <h2 className="text-lg font-semibold">Staff</h2>
                        </a>
                    )}
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
