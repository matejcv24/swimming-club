import { useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const listeners = new Set<() => void>();
let currentAppearance: Appearance = 'dark';

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const isAppearance = (value: unknown): value is Appearance =>
    value === 'light' || value === 'dark' || value === 'system';

const getStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') {
        return 'dark';
    }

    const stored = localStorage.getItem('appearance');

    return isAppearance(stored) ? stored : 'dark';
};

const storeLocally = (mode: Appearance): void => {
    localStorage.setItem('appearance', mode);
    setCookie('appearance', mode);
};

// Save the choice on the logged-in user, so it follows them to every login and device
const saveForUser = (mode: Appearance): void => {
    const xsrf = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    fetch('/settings/appearance', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': xsrf ? decodeURIComponent(xsrf) : '',
        },
        body: JSON.stringify({ appearance: mode }),
    }).catch(() => {
        // Offline: the choice still applies on this device and is saved next time
    });
};

const isDarkMode = (appearance: Appearance): boolean => {
    return appearance === 'dark' || (appearance === 'system' && prefersDark());
};

const applyTheme = (appearance: Appearance): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const isDark = isDarkMode(appearance);

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

const mediaQuery = (): MediaQueryList | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = (): void => applyTheme(currentAppearance);

export function initializeTheme(): void {
    if (typeof window === 'undefined') {
        return;
    }

    // The server renders the logged-in user's saved choice into <html data-appearance>.
    // Back/Forward can show an older copy of the page, so then this device's latest choice wins.
    const fromServer = document.documentElement.dataset.appearance;
    const navigation = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
    const isBackForward = navigation?.type === 'back_forward';

    currentAppearance =
        isAppearance(fromServer) && !isBackForward
            ? fromServer
            : getStoredAppearance();

    // Pages restored from the browser's back/forward cache skip this script entirely
    window.addEventListener('pageshow', (event) => {
        const latest = getStoredAppearance();

        if (event.persisted && latest !== currentAppearance) {
            currentAppearance = latest;
            applyTheme(latest);
            notify();
        }
    });
    storeLocally(currentAppearance);
    applyTheme(currentAppearance);

    // Set up system theme change listener
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

/**
 * Apply a user's saved choice without saving it again, e.g. after another
 * user logs in on the same device.
 */
export function syncAppearance(mode: Appearance): void {
    if (mode === currentAppearance) {
        return;
    }

    currentAppearance = mode;
    storeLocally(mode);
    applyTheme(mode);
    notify();
}

export function useAppearance(): UseAppearanceReturn {
    const appearance: Appearance = useSyncExternalStore(
        subscribe,
        () => currentAppearance,
        () => 'dark',
    );

    const resolvedAppearance: ResolvedAppearance = isDarkMode(appearance)
        ? 'dark'
        : 'light';

    const updateAppearance = (mode: Appearance): void => {
        currentAppearance = mode;
        storeLocally(mode);
        applyTheme(mode);
        notify();
        saveForUser(mode);
    };

    return { appearance, resolvedAppearance, updateAppearance } as const;
}
