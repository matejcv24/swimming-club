import { usePage } from '@inertiajs/react';
import type { DashboardSummary } from '@/components/dashboard-cards';
import { DashboardCards } from '@/components/dashboard-cards';

/**
 * The dashboard drawn behind a pop-up page (members, fees, invoices...), so the
 * pop-up looks like it opened on top of the dashboard. It can't be clicked or
 * focused: clicking beside the pop-up closes it, as before.
 */
export function DashboardBackground() {
    const { dashboardSummary } = usePage().props as {
        dashboardSummary?: DashboardSummary | null;
    };

    if (!dashboardSummary) {
        return null;
    }

    return (
        <div inert aria-hidden="true" className="select-none">
            <DashboardCards {...dashboardSummary} />
        </div>
    );
}
