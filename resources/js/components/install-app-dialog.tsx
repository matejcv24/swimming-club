import { usePage } from '@inertiajs/react';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import AddToHomeScreenIcon from '@mui/icons-material/AddToHomeScreen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IosShareIcon from '@mui/icons-material/IosShare';
import MenuIcon from '@mui/icons-material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { MuiThemeProvider, POPUP_BG } from '@/components/mui-theme-provider';
import { PopupHeader } from '@/components/popup-ui';
import {
    canInstallDirectly,
    installApp,
    iphoneBrowser,
    isInstalled,
    isIphone,
    isPhone,
    onInstallChange,
    pushState,
    turnPushOn,
} from '@/lib/device';
import { t } from '@/lib/i18n';

type Shared = {
    club?: { name?: string; logo_url?: string | null } | null;
    pushKey?: string | null;
};

const icon = { fontSize: 'inherit' as const, sx: { verticalAlign: '-3px' } };

/** One numbered step. */
function Step({ n, children }: { n: number; children: ReactNode }) {
    return (
        <li className="flex items-start gap-2.5 py-1.5 text-[14px] leading-snug text-[var(--popup-fg)]">
            <span className="mt-px flex size-5 flex-none items-center justify-center rounded-full bg-hydra-blue/15 text-[11px] font-bold text-hydra-blue">
                {n}
            </span>
            <span>{children}</span>
        </li>
    );
}

const addToHome = (
    <>
        <AddBoxOutlinedIcon {...icon} /> „Add to Home Screen“
    </>
);

/** What this phone's person has to do, for their own browser. */
function Steps({ android }: { android: boolean }) {
    if (android) {
        return (
            <ol>
                <Step n={1}>
                    {t('Tap')} <MoreVertIcon {...icon} />{' '}
                    {t('at the top right')}
                </Step>
                <Step n={2}>„Add to Home screen“ {t('or')} „Install app“</Step>
                <Step n={3}>{t('Confirm with “Add” / “Install”')}</Step>
            </ol>
        );
    }

    switch (iphoneBrowser()) {
        case 'safari':
            return (
                <ol>
                    <Step n={1}>
                        {t('Tap')} <MenuIcon {...icon} />{' '}
                        {t('(the three lines)')}
                    </Step>
                    <Step n={2}>
                        {t('Tap')} <IosShareIcon {...icon} /> „Share“
                    </Step>
                    <Step n={3}>
                        {t('Scroll down to')} {addToHome}
                    </Step>
                    <Step n={4}>{t('Tap “Add”')}</Step>
                </ol>
            );
        case 'chrome':
            return (
                <ol>
                    <Step n={1}>
                        {t('Tap')} <IosShareIcon {...icon} />{' '}
                        {t('next to the address bar')}
                    </Step>
                    <Step n={2}>
                        {t('Scroll down to')} {addToHome}
                    </Step>
                    <Step n={3}>{t('Tap “Add”')}</Step>
                </ol>
            );
        default:
            // Edge, Firefox, and browsers we don't know
            return (
                <ol>
                    <Step n={1}>
                        {t('Open the browser’s menu')} (
                        <MenuIcon {...icon} /> {t('or')} •••)
                    </Step>
                    <Step n={2}>
                        {t('Tap')} <IosShareIcon {...icon} /> „Share“
                    </Step>
                    <Step n={3}>
                        {t('Scroll down to')} {addToHome}
                    </Step>
                    <Step n={4}>{t('Tap “Add”')}</Step>
                </ol>
            );
    }
}

/** Copies the link (with a fallback for older phones). */
async function copyLink(): Promise<boolean> {
    const link = `${window.location.origin}/dashboard`;

    try {
        await navigator.clipboard.writeText(link);

        return true;
    } catch {
        const field = document.createElement('textarea');
        field.value = link;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();

        return copied;
    }
}

/**
 * "Add to home screen" on a phone. Android: our button opens the phone's own
 * "Install?" box. iPhone: Apple allows no button, so the steps for the browser
 * in use (or "open in Safari" inside apps like Gmail and Viber).
 *
 * onDone: the person installed it or read the steps (no more reminders);
 * onClose: closed for now (asked again later).
 */
export function InstallAppDialog({
    open,
    onClose,
    onDone,
}: {
    open: boolean;
    onClose: () => void;
    onDone: () => void;
}) {
    const { club, pushKey } = usePage().props as Shared;
    const [direct, setDirect] = useState(canInstallDirectly);
    const [installed, setInstalled] = useState(false);
    const [copied, setCopied] = useState(false);
    const [offerPush, setOfferPush] = useState(false);

    useEffect(() => onInstallChange(() => setDirect(canInstallDirectly())), []);

    const android = !isIphone();
    const inApp = !android && iphoneBrowser() === 'in-app';

    const install = async () => {
        if (await installApp()) {
            setInstalled(true);
            // On Android push works in the browser too: offer it right away
            setOfferPush(Boolean(pushKey) && (await pushState()) === 'off');
        }
    };

    const enablePush = async () => {
        if (pushKey) {
            await turnPushOn(pushKey).catch(() => 'off');
        }

        onDone();
    };

    const primary = (
        label: string,
        onClick: () => void,
        startIcon?: ReactNode,
    ) => (
        <Button
            type="button"
            variant="contained"
            fullWidth
            startIcon={startIcon}
            onClick={onClick}
            sx={{ whiteSpace: 'nowrap' }}
        >
            {label}
        </Button>
    );

    let body: ReactNode;
    let actions: ReactNode;

    if (installed) {
        body = (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
                <CheckCircleIcon sx={{ fontSize: 44, color: '#16a34a' }} />
                <p className="text-[15px] font-bold text-[var(--popup-fg)]">
                    {t('The app is on your home screen')}
                </p>
                {offerPush && (
                    <p className="text-[13.5px] text-[var(--popup-muted)]">
                        {t(
                            'Turn on notifications to know when something changes in the club.',
                        )}
                    </p>
                )}
            </div>
        );
        actions = offerPush ? (
            <>
                <Button
                    type="button"
                    variant="outlined"
                    fullWidth
                    onClick={onDone}
                >
                    {t('Not now')}
                </Button>
                {primary(t('Turn on'), enablePush, <NotificationsActiveIcon />)}
            </>
        ) : (
            primary(t('Done'), onDone)
        );
    } else if (android && direct) {
        body = (
            <div className="flex flex-col items-center gap-2 pt-1 pb-2 text-center">
                {club?.logo_url ? (
                    <img
                        src={club.logo_url}
                        alt=""
                        className="size-14 rounded-2xl object-cover"
                    />
                ) : (
                    <img
                        src="/icons/icon-192.png"
                        alt=""
                        className="size-14 rounded-2xl"
                    />
                )}
                <p className="text-[13.5px] leading-relaxed text-[var(--popup-muted)]">
                    {t(
                        'It opens like an app: faster, full screen, and with notifications.',
                    )}
                </p>
            </div>
        );
        actions = (
            <>
                <Button
                    type="button"
                    variant="outlined"
                    fullWidth
                    onClick={onClose}
                >
                    {t('Later')}
                </Button>
                {primary(t('Install'), install, <AddToHomeScreenIcon />)}
            </>
        );
    } else if (inApp) {
        body = (
            <p className="pb-2 text-[14px] leading-relaxed text-[var(--popup-fg)]">
                {t(
                    'The app can’t be added to the home screen from here. Copy the link and open it in Safari.',
                )}
            </p>
        );
        actions = (
            <>
                <Button
                    type="button"
                    variant="outlined"
                    fullWidth
                    onClick={onClose}
                >
                    {t('Later')}
                </Button>
                {primary(
                    copied ? t('Copied') : t('Copy link'),
                    async () => setCopied(await copyLink()),
                    <ContentCopyIcon />,
                )}
            </>
        );
    } else {
        body = (
            <>
                <Steps android={android} />
                {!android && iphoneBrowser() === 'other' && (
                    <p className="mt-2 rounded-lg bg-[var(--popup-ghost)] px-3 py-2 text-[12.5px] text-[var(--popup-muted)]">
                        {t('Can’t find the button? Open this page in Safari.')}
                    </p>
                )}
            </>
        );
        actions = primary(t('Got it'), onDone);
    }

    return (
        <MuiThemeProvider>
            <Dialog
                open={open}
                onClose={onClose}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<AddToHomeScreenIcon fontSize="small" />}
                        title={installed ? t('Done') : t('Home screen')}
                        onClose={onClose}
                    />
                </DialogTitle>
                <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                    {body}
                    <div className="mt-3 flex gap-2">{actions}</div>
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
}

// ---- When the pop-up shows by itself ----------------------------------------

const STORE = 'install-prompt';
const MAX_TIMES = 3;
const WAIT_DAYS = 7;

type Remembered = { times: number; next: number; done: boolean };

function remembered(): Remembered {
    try {
        return {
            times: 0,
            next: 0,
            done: false,
            ...JSON.parse(localStorage.getItem(STORE) ?? '{}'),
        };
    } catch {
        return { times: 0, next: 0, done: false };
    }
}

function remember(value: Remembered) {
    try {
        localStorage.setItem(STORE, JSON.stringify(value));
    } catch {
        // Private mode: it simply asks again next time
    }
}

/** No more reminders on this phone (installed, or the steps were read). */
export function stopInstallReminders() {
    remember({ ...remembered(), done: true });
}

/**
 * Shows the pop-up by itself on a phone: after the first login, then (after
 * "Later") at most twice more, a week apart. Never on computers or once the
 * app is installed.
 */
export function useInstallReminder(loggedIn: boolean): boolean {
    const [due, setDue] = useState(false);

    useEffect(() => {
        if (!loggedIn || !isPhone() || isInstalled()) {
            return;
        }

        const state = remembered();

        if (state.done || state.times >= MAX_TIMES || Date.now() < state.next) {
            return;
        }

        let timer: number | undefined;
        const show = () => {
            remember({
                ...state,
                times: state.times + 1,
                next: Date.now() + WAIT_DAYS * 24 * 60 * 60 * 1000,
            });
            setDue(true);
        };
        // Let the page settle first
        const showSoon = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(show, 2500);
        };

        // iPhone: the steps. Android: only once the phone offers our "Install"
        // button (Chrome waits until the site has been used a little; if it
        // never offers, e.g. the app is already installed, nothing shows)
        if (isIphone()) {
            showSoon();
        } else if (canInstallDirectly()) {
            showSoon();
        }

        const stop = isIphone()
            ? () => {}
            : onInstallChange(() => {
                  if (canInstallDirectly()) {
                      showSoon();
                  }
              });

        return () => {
            window.clearTimeout(timer);
            stop();
        };
    }, [loggedIn]);

    return due;
}

// ---- Notifications, the first time the installed app opens -------------------

const PUSH_ASKED = 'push-asked';

/**
 * The first time the installed app is opened (on iPhone, push only works
 * there), it offers notifications once.
 */
export function PushOffer() {
    const { pushKey } = usePage().props as Shared;
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!pushKey || !isInstalled() || !('Notification' in window)) {
            return;
        }

        try {
            if (localStorage.getItem(PUSH_ASKED)) {
                return;
            }
        } catch {
            return;
        }

        if (Notification.permission !== 'default') {
            return;
        }

        pushState().then((state) => setOpen(state === 'off'));
    }, [pushKey]);

    const close = () => {
        try {
            localStorage.setItem(PUSH_ASKED, '1');
        } catch {
            // nothing to remember it in
        }

        setOpen(false);
    };

    const enable = async () => {
        if (pushKey) {
            await turnPushOn(pushKey).catch(() => 'off');
        }

        close();
    };

    return (
        <MuiThemeProvider>
            <Dialog
                open={open}
                onClose={close}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<NotificationsActiveIcon fontSize="small" />}
                        title={t('Turn on notifications?')}
                        onClose={close}
                    />
                </DialogTitle>
                <DialogContent sx={{ px: 2.25, pt: 0.5 }}>
                    <p className="text-[14px] leading-relaxed text-[var(--popup-fg)]">
                        {t(
                            'Get a notification on this phone when something changes in the club, like in the bell.',
                        )}
                    </p>
                    <div className="mt-3 flex gap-2">
                        <Button
                            type="button"
                            variant="outlined"
                            fullWidth
                            onClick={close}
                        >
                            {t('Not now')}
                        </Button>
                        <Button
                            type="button"
                            variant="contained"
                            fullWidth
                            startIcon={<NotificationsActiveIcon />}
                            onClick={enable}
                        >
                            {t('Turn on')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
}
