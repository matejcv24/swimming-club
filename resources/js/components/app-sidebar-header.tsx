import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { AppHeaderActions } from '@/components/app-header-actions';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ClubMark } from '@/components/club-mark';
import { ClubSettingsDialog } from '@/components/club-settings-dialog';
import { Hint } from '@/components/popup-ui';
import { t } from '@/lib/i18n';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import type { ClubSharedData } from '@/types/club';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { club, auth } = usePage().props as {
        club?: ClubSharedData | null;
        auth?: { user?: { role?: string } | null };
    };
    const [settingsOpen, setSettingsOpen] = useState(false);
    const name = club?.name ?? 'SC Hydra';
    // Only admins change the club's details; coaches just see its name
    const canEditClub = auth?.user?.role === 'admin' && !!club;
    const logoUrl = club?.logo_url ?? null;

    return (
        <header className="flex h-16 w-full max-w-full shrink-0 items-center gap-2 overflow-x-hidden border-b border-border px-3 transition-[width,height] ease-linear md:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
                {/* The club's logo goes back to the dashboard (no logo: just the name) */}
                {logoUrl && (
                    <Link
                        href="/dashboard"
                        aria-label={t('Dashboard')}
                        className="flex flex-none items-center"
                    >
                        <ClubMark
                            name={name}
                            logoUrl={logoUrl}
                            initials={false}
                        />
                    </Link>
                )}

                {breadcrumbs.length === 0 &&
                    (canEditClub ? (
                        // Admins: the name opens the club's settings
                        <Hint title={t('Club settings')}>
                            <button
                                type="button"
                                onClick={() => setSettingsOpen(true)}
                                className="min-w-0 cursor-pointer truncate rounded-full border border-foreground/25 px-3.5 py-1.5 text-base font-bold tracking-wide transition hover:border-foreground/50 hover:bg-black/5 dark:border-white/25 dark:hover:border-white/50 dark:hover:bg-white/10"
                            >
                                {name}
                            </button>
                        </Hint>
                    ) : (
                        <Link
                            href="/dashboard"
                            className="min-w-0 truncate text-base font-bold tracking-wide"
                        >
                            {name}
                        </Link>
                    ))}

                {/* Pages with their own title (Notifications, Settings) show it next to the logo;
                    without a logo the club's name is the way back to the dashboard */}
                {breadcrumbs.length > 0 && !logoUrl && (
                    <Link
                        href="/dashboard"
                        className="max-w-[40%] min-w-0 truncate text-base font-bold tracking-wide"
                    >
                        {name}
                    </Link>
                )}
                {breadcrumbs.length > 0 && (
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                )}
            </div>
            <AppHeaderActions />

            {settingsOpen && (
                <ClubSettingsDialog onClose={() => setSettingsOpen(false)} />
            )}
        </header>
    );
}
