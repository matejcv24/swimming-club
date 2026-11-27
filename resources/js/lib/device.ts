/**
 * This device: is it a phone, is the app on its home screen, which browser,
 * and push notifications on / off. Everything here only runs in the browser.
 */

const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent);

/** iPhone (iPads and computers aren't phones). */
export const isIphone = () => /iPhone|iPod/.test(ua());

/** A phone: iPhone, or Android with "Mobile" (Android tablets leave it out). */
export const isPhone = () =>
    isIphone() || (/Android/.test(ua()) && /Mobile/.test(ua()));

/** Opened from the home-screen icon (the installed app), not in a browser tab. */
export const isInstalled = () =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone ===
            true);

export type IphoneBrowser =
    | 'safari'
    | 'chrome'
    | 'edge'
    | 'firefox'
    | 'in-app'
    | 'other';

/** Which browser an iPhone is using: each keeps "Share" somewhere else. */
export function iphoneBrowser(): IphoneBrowser {
    const agent = ua();

    if (/CriOS/.test(agent)) {
        return 'chrome';
    }

    if (/EdgiOS/.test(agent)) {
        return 'edge';
    }

    if (/FxiOS/.test(agent)) {
        return 'firefox';
    }

    // Pages opened inside Gmail, Viber, Instagram, Facebook...: they can't add
    // to the home screen (their browsers don't say "Safari")
    if (
        /FBAN|FBAV|Instagram|Line\/|Viber|GSA\/|LinkedInApp|Snapchat|TikTok|Twitter/.test(
            agent,
        ) ||
        !/Safari\//.test(agent)
    ) {
        return 'in-app';
    }

    return /Version\/[\d.]+.*Safari\//.test(agent) ? 'safari' : 'other';
}

// ---- Installing on Android -------------------------------------------------

type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let installEvent: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
    // Chrome / Edge / Samsung on Android offer installing: keep the offer for
    // our own button instead of the browser's banner
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        installEvent = event as InstallPromptEvent;
        listeners.forEach((listener) => listener());
    });
    window.addEventListener('appinstalled', () => {
        installEvent = null;
        listeners.forEach((listener) => listener());
    });
}

/** True when the browser can install the app with one tap (Android). */
export const canInstallDirectly = () => installEvent !== null;

export function onInstallChange(listener: () => void): () => void {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

/** Opens the phone's own "Install?" box; true when the person said yes. */
export async function installApp(): Promise<boolean> {
    if (!installEvent) {
        return false;
    }

    const event = installEvent;
    await event.prompt();
    const { outcome } = await event.userChoice;
    installEvent = null;
    listeners.forEach((listener) => listener());

    return outcome === 'accepted';
}

// ---- Push notifications ----------------------------------------------------

export type PushState =
    // The browser can't (an iPhone needs the app on the home screen first)
    | 'unsupported'
    // Blocked in the browser's settings: only the person can allow it again
    | 'blocked'
    | 'on'
    | 'off';

const pushSupported = () =>
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

async function currentSubscription(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.getRegistration();

    return registration ? registration.pushManager.getSubscription() : null;
}

export async function pushState(): Promise<PushState> {
    if (!pushSupported()) {
        return 'unsupported';
    }

    if (Notification.permission === 'denied') {
        return 'blocked';
    }

    return Notification.permission === 'granted' &&
        (await currentSubscription())
        ? 'on'
        : 'off';
}

function send(method: 'POST' | 'DELETE', body: unknown) {
    const xsrf = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    return fetch('/push-subscriptions', {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': xsrf ? decodeURIComponent(xsrf) : '',
        },
        body: JSON.stringify(body),
    });
}

const keyBytes = (base64: string) => {
    const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

/** Asks the browser ("Allow notifications?") and remembers this device. */
export async function turnPushOn(publicKey: string): Promise<PushState> {
    if (!pushSupported()) {
        return 'unsupported';
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        return permission === 'denied' ? 'blocked' : 'off';
    }

    const registration =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register('/sw.js'));
    await navigator.serviceWorker.ready;

    const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyBytes(publicKey),
        }));

    const response = await send('POST', {
        ...subscription.toJSON(),
        content_encoding: (
            PushManager as unknown as {
                supportedContentEncodings?: string[];
            }
        ).supportedContentEncodings?.includes('aes128gcm')
            ? 'aes128gcm'
            : 'aesgcm',
    });

    if (!response.ok) {
        await subscription.unsubscribe();

        throw new Error('push');
    }

    return 'on';
}

/** The number on the installed app's icon (where the device supports it). */
export function setIconBadge(count: number) {
    if (typeof navigator === 'undefined' || !('setAppBadge' in navigator)) {
        return;
    }

    (count > 0
        ? navigator.setAppBadge(count)
        : navigator.clearAppBadge()
    ).catch(() => {});
}

/** This device stops getting push notifications. */
export async function turnPushOff(): Promise<PushState> {
    const subscription = pushSupported() ? await currentSubscription() : null;

    if (subscription) {
        await send('DELETE', { endpoint: subscription.endpoint }).catch(
            () => {},
        );
        await subscription.unsubscribe();
    }

    return pushSupported() ? 'off' : 'unsupported';
}
