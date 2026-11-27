import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { ClubAccessBanner } from '@/components/club-access-banner';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <AppContent variant="header">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <ClubAccessBanner />
                {children}
            </AppContent>
        </AppShell>
    );
}
