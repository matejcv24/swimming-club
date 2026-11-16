import { Head } from '@inertiajs/react';
import { DashboardBackground } from '@/components/dashboard-background';
import { ManageGroupsDialog } from '@/components/manage-groups-dialog';
import type { MemberDetails } from '@/components/member-details-dialog';
import { MuiThemeProvider } from '@/components/mui-theme-provider';
import { usePagePopup } from '@/hooks/use-page-popup';
import { useGroups } from '@/lib/groups';

/** The club's groups and subgroups, opened from the dashboard (admins only). */
export default function GroupsIndex({ members }: { members: MemberDetails[] }) {
    const groups = useGroups();
    // Fades in and out over the dashboard
    const popup = usePagePopup();

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title="Groups" />

            <ManageGroupsDialog
                open={popup.dialogProps.open}
                onClose={popup.close}
                transition={popup.dialogProps}
                groups={groups}
                members={members}
            />
        </MuiThemeProvider>
    );
}
