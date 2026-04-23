import { AppHeaderActions } from '@/components/app-header-actions';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 w-full max-w-full shrink-0 items-center gap-2 overflow-x-hidden border-b border-sidebar-border/50 px-3 transition-[width,height] ease-linear md:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <AppHeaderActions />
        </header>
    );
}
