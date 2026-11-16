import { router } from '@inertiajs/react';
import { useState } from 'react';
import { wasSkeletonShown } from '@/hooks/use-pending-popup';

/** How long pop-ups take to fade in and out (ms). */
export const POPUP_FADE = { enter: 225, exit: 195 } as const;

/**
 * For a page that is a pop-up over the dashboard (Members, Staff...): it fades in
 * when opened and fades out when closed, and only then the dashboard comes back.
 *
 * Spread `dialogProps` on the page's Dialog and call `close` from its X button.
 */
export function usePagePopup(back = '/dashboard') {
    const [open, setOpen] = useState(true);
    // If the pop-up's placeholder frame was already on screen (slow connection),
    // the real pop-up takes its place without fading in a second time
    const [replacesSkeleton] = useState(wasSkeletonShown);

    const close = () => {
        if (!open) {
            return;
        }

        setOpen(false);
        // Start loading the dashboard during the fade, so it is ready when it ends
        router.prefetch(back, { method: 'get' }, { cacheFor: '5s' });
    };

    return {
        close,
        dialogProps: {
            open,
            onClose: close,
            transitionDuration: {
                enter: replacesSkeleton ? 0 : POPUP_FADE.enter,
                exit: POPUP_FADE.exit,
            },
            TransitionProps: {
                onExited: () => router.visit(back, { preserveScroll: true }),
            },
        },
    };
}
