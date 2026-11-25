import { usePage } from '@inertiajs/react';
import { Bell, CircleCheck, Loader2, Send, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { PushState } from '@/lib/device';
import {
    isInstalled,
    isIphone,
    isPhone,
    pushState,
    testPush,
    turnPushOff,
    turnPushOn,
} from '@/lib/device';
import { t } from '@/lib/i18n';

/** A small on / off switch (drawn, so the whole row is the button). */
function Toggle({ on, busy }: { on: boolean; busy: boolean }) {
    if (busy) {
        return (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={`relative h-5 w-9 flex-none rounded-full transition-colors ${
                on ? 'bg-hydra-blue' : 'bg-muted-foreground/30'
            }`}
        >
            <span
                className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${
                    on ? 'left-[18px]' : 'left-0.5'
                }`}
            />
        </span>
    );
}

/**
 * "This device" in the avatar menu: push notifications on / off here, and on
 * phones "Add to home screen" (or that the app already is there).
 */
export function DeviceMenuItems({ onInstall }: { onInstall: () => void }) {
    const { pushKey } = usePage().props as { pushKey?: string | null };
    const [state, setState] = useState<PushState | null>(null);
    const [busy, setBusy] = useState(false);
    const [phone, setPhone] = useState(false);
    const [installed, setInstalled] = useState(false);
    // The test push: sending, then what happened
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);

    useEffect(() => {
        setPhone(isPhone());
        setInstalled(isInstalled());
        pushState().then(setState);
    }, []);

    const togglePush = async (event: Event) => {
        // The menu stays open, so the switch is seen moving
        event.preventDefault();

        if (busy || !pushKey) {
            return;
        }

        if (state === 'unsupported' && isIphone() && !installed) {
            onInstall();

            return;
        }

        if (state !== 'on' && state !== 'off') {
            return;
        }

        setBusy(true);

        try {
            setState(
                state === 'on'
                    ? await turnPushOff()
                    : await turnPushOn(pushKey),
            );
        } catch {
            setState(await pushState());
        } finally {
            setBusy(false);
        }
    };

    const sendTest = async (event: Event) => {
        event.preventDefault();

        if (testing) {
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const result = await testPush();
            setTestResult(
                result.sent
                    ? t('Sent. It should appear in a few seconds.')
                    : `${t('Not delivered')}: ${result.reason}`,
            );
        } catch {
            setTestResult(t('Not delivered') + ': ' + t('no connection'));
        } finally {
            setTesting(false);
        }
    };

    // What's under "Notifications" when the switch can't be used
    const note =
        state === 'blocked'
            ? t('Blocked: allow them in the browser’s settings')
            : state === 'unsupported'
              ? isIphone() && !installed
                  ? t('First add the app to the home screen')
                  : t('This browser doesn’t support them')
              : null;

    const showPush = Boolean(pushKey) && state !== null;
    const showInstall = phone;

    if (!showPush && !showInstall) {
        return null;
    }

    return (
        <>
            <DropdownMenuLabel className="pt-1 pb-0.5 text-[11px] font-medium text-muted-foreground">
                {t('This device')}
            </DropdownMenuLabel>

            {showPush && (
                <DropdownMenuItem
                    onSelect={togglePush}
                    className="cursor-pointer items-center"
                    role="menuitemcheckbox"
                    aria-checked={state === 'on'}
                >
                    <Bell className="mr-2 size-4 flex-none" />
                    <span className="min-w-0 flex-1">
                        <span className="block">{t('Notifications')}</span>
                        {note && (
                            <span className="block text-[11px] leading-tight text-muted-foreground">
                                {note}
                            </span>
                        )}
                    </span>
                    {(state === 'on' || state === 'off') && (
                        <Toggle on={state === 'on'} busy={busy} />
                    )}
                </DropdownMenuItem>
            )}

            {showPush && state === 'on' && (
                <DropdownMenuItem
                    onSelect={sendTest}
                    className="cursor-pointer items-start"
                >
                    {testing ? (
                        <Loader2 className="mt-0.5 mr-2 size-4 flex-none animate-spin" />
                    ) : (
                        <Send className="mt-0.5 mr-2 size-4 flex-none" />
                    )}
                    <span className="min-w-0 flex-1">
                        <span className="block">
                            {t('Send a test notification')}
                        </span>
                        {testResult && (
                            <span className="block text-[11px] leading-tight break-words text-muted-foreground">
                                {testResult}
                            </span>
                        )}
                    </span>
                </DropdownMenuItem>
            )}

            {showInstall &&
                (installed ? (
                    <DropdownMenuItem
                        disabled
                        className="items-center text-green-700 opacity-100 data-[disabled]:opacity-100 dark:text-green-400"
                    >
                        <CircleCheck className="mr-2 size-4 text-current" />
                        {t('The app is installed')}
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem
                        onSelect={onInstall}
                        className="cursor-pointer items-center"
                    >
                        <Smartphone className="mr-2 size-4" />
                        {t('Add to home screen')}
                    </DropdownMenuItem>
                ))}
            <DropdownMenuSeparator />
        </>
    );
}
