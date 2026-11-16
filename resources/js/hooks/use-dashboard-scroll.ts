import { useEffect } from 'react';

const KEY = 'dashboard-scroll';

// True until the dashboard has been shown once since the app was opened or the page
// refreshed (this file is loaded again on every full load).
let freshStart = true;

/**
 * Phones: the dashboard is a long list of cards. Opening a card's pop-up and
 * closing it brings the dashboard back where it was (e.g. at Staff, at the
 * bottom) instead of at the top. Opening the app or refreshing the page always
 * starts at the top. The position is kept for this browser tab only.
 */
export function useDashboardScroll() {
    useEffect(() => {
        let frame = 0;
        const remember = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                try {
                    sessionStorage.setItem(KEY, String(window.scrollY));
                } catch {
                    // Nothing to keep it in
                }
            });
        };

        // After the page change has finished: the app moves every new page to the
        // top once it is shown, so going back to the saved place must come after that.
        // Only then start remembering, so that jump to the top is not saved.
        const restore = setTimeout(() => {
            if (freshStart) {
                // Opened or refreshed: start at the top and forget the old place
                freshStart = false;
                window.scrollTo(0, 0);

                try {
                    sessionStorage.removeItem(KEY);
                } catch {
                    // Storage blocked: nothing was kept
                }
            } else {
                try {
                    const saved = Number(sessionStorage.getItem(KEY));

                    if (saved > 0) {
                        window.scrollTo(0, saved);
                    }
                } catch {
                    // Storage blocked (private mode): the dashboard just opens at the top
                }
            }

            window.addEventListener('scroll', remember, { passive: true });
        }, 0);

        return () => {
            clearTimeout(restore);
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', remember);
        };
    }, []);
}
