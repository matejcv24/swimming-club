import { createInertiaApp, router } from '@inertiajs/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { Locale } from '@/lib/i18n';
import { setLocale } from '@/lib/i18n';

const appName = import.meta.env.VITE_APP_NAME || 'SC Hydra';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            // Pages for people without an account (a parent's view): their own look
            case name.startsWith('public/'):
                return null;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        // The language the server chose for this page, before anything is drawn:
        // the server's pre-render and the browser then show the same text
        // With strictMode the app comes wrapped in <StrictMode>: the page is on
        // the wrapped element. Without it, the server (no document) always drew
        // Macedonian and an English page failed to hydrate.
        type AppProps = {
            initialPage?: { props?: { locale?: Locale } };
            children?: { props?: AppProps };
        };
        const props = app.props as AppProps;
        const page = props.initialPage ?? props.children?.props?.initialPage;

        if (page?.props?.locale) {
            setLocale(page.props.locale);
        }

        return <TooltipProvider delayDuration={0}>{app}</TooltipProvider>;
    },
    progress: {
        color: '#4B5563',
    },
});

// Pop-ups are loaded ahead (dashboard cards, quick actions). Once anything is
// saved, those copies may be out of date: drop them, they load again fresh
if (typeof window !== 'undefined') {
    router.on('finish', (event) => {
        const { visit } = event.detail;

        if (visit.method !== 'get' && visit.completed) {
            router.flushAll();
        }
    });
}

// This will set light / dark mode on load...
initializeTheme();
