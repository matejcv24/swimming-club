import { usePage } from '@inertiajs/react';
import { t, tc } from '@/lib/i18n';

/** From ClubAccess::banner(): null when there is nothing to say. */
type ClubAccessBanner = {
    state: 'demo' | 'active' | 'grace' | 'read_only';
    ends_at: string | null;
    days_left: number | null;
} | null;

const STYLES = {
    info: 'border-sky-200 bg-sky-50 text-slate-900 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-100',
    warn: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100',
    stop: 'border-red-300 bg-red-50 text-red-950 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100',
} as const;

/**
 * The subscription banner under the top bar: the demo or paid period ending
 * soon, the 3 grace days, or read-only. Clubs that never expire never see it.
 */
export function ClubAccessBanner() {
    const banner = usePage().props.clubAccess as ClubAccessBanner;

    if (!banner) {
        return null;
    }

    const days = Math.max(banner.days_left ?? 0, 0);
    const endsAt = banner.ends_at
        ? new Date(banner.ends_at).toLocaleDateString('mk-MK')
        : '';

    const content = {
        demo: {
            tone: STYLES.info,
            title: t('The demo lasts until :date', { date: endsAt }),
            text: tc(
                ':count more day free. After that a subscription is needed to continue.|:count more days free. After that a subscription is needed to continue.',
                days,
            ),
        },
        active: {
            tone: STYLES.info,
            title: t('The subscription lasts until :date', { date: endsAt }),
            text: tc(
                'It ends in :count day. Renew it so nothing stops.|It ends in :count days. Renew it so nothing stops.',
                days,
            ),
        },
        grace: {
            tone: STYLES.warn,
            title: t('The subscription has ended'),
            text: tc(
                'Everything works for :count more day. After that the app is read-only.|Everything works for :count more days. After that the app is read-only.',
                days,
            ),
        },
        read_only: {
            tone: STYLES.stop,
            title: t('The app is read-only'),
            text: t(
                'You can see everything, but nothing can be added or changed. Nothing was deleted.',
            ),
        },
    }[banner.state];

    return (
        <div className="mx-auto w-full max-w-7xl px-4 pt-3">
            <div
                role="status"
                className={`rounded-2xl border px-4 py-3 text-[15px] ${content.tone}`}
            >
                <p className="font-bold">{content.title}</p>
                <p>{content.text}</p>
            </div>
        </div>
    );
}
