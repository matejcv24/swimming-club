import { Link } from '@inertiajs/react';
import { AppHeaderActions } from '@/components/app-header-actions';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 w-full max-w-full shrink-0 items-center gap-2 overflow-x-hidden border-b border-border px-3 transition-[width,height] ease-linear md:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
                {/* Club logo and name, back to the dashboard */}
                <Link
                    href="/dashboard"
                    className="flex flex-none items-center gap-2.5"
                >
                    <img
                        src="/images/hydra-mark.png"
                        alt=""
                        width={32}
                        height={32}
                        className="size-8 rounded-full bg-hydra-navy shadow-[0_0_0_1px_#dbe7f0] dark:shadow-[0_0_0_1px_rgb(186_230_253/0.14)]"
                    />
                    {breadcrumbs.length === 0 && (
                        <span className="text-base font-bold tracking-wide">
                            SC Hydra
                        </span>
                    )}
                </Link>

                {/* Pages with their own title (Notifications, Settings) show it next to the logo */}
                {breadcrumbs.length > 0 && (
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                )}
            </div>
            <AppHeaderActions />
        </header>
    );
}
