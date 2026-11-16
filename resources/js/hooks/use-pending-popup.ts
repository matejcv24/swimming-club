import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/** The pop-ups the dashboard opens, by address, with the title they show. */
const POPUP_TITLES: Record<string, string> = {
    '/members': 'Members',
    '/trainings': 'Trainings',
    '/membership-fees': 'Membership Fees',
    '/attendance': 'Attendance',
    '/unpaid-fees': 'Unpaid Fees',
    '/staff': 'Staff',
    '/invoices': 'Invoices',
    '/profit': 'Profit',
    '/groups': 'Groups',
    '/notifications': 'Notifications',
};

// Pages that arrive faster than this (already loaded, or a quick connection) open
// straight away, without the placeholder flashing in between.
const SHOW_AFTER_MS = 120;

// Whether the placeholder frame was on screen when the page arrived
let skeletonShown = false;

/** Whether the placeholder frame is on screen (the pop-up replacing it asks). */
export function wasSkeletonShown(): boolean {
    return skeletonShown;
}

/**
 * While a pop-up page is on its way from the server, the title of the pop-up being
 * opened (else null), so the dashboard can show its frame right away.
 */
export function usePendingPopup(): string | null {
    const [title, setTitle] = useState<string | null>(null);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        const stopStart = router.on('start', (event) => {
            const visit = event.detail.visit;
            const popupTitle = POPUP_TITLES[visit.url.pathname];

            if (
                !popupTitle ||
                visit.prefetch ||
                visit.method !== 'get' ||
                visit.only.length > 0
            ) {
                return;
            }

            clearTimeout(timer);
            skeletonShown = false;
            timer = setTimeout(() => {
                skeletonShown = true;
                setTitle(popupTitle);
            }, SHOW_AFTER_MS);
        });

        const stopFinish = router.on('finish', () => {
            clearTimeout(timer);
            setTitle(null);
        });

        return () => {
            // The dashboard is gone, so is its placeholder (the pop-up page has
            // already asked by now)
            skeletonShown = false;
            clearTimeout(timer);
            stopStart();
            stopFinish();
        };
    }, []);

    return title;
}
