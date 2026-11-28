import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SendIcon from '@mui/icons-material/Send';
import UndoIcon from '@mui/icons-material/Undo';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/lib/i18n';
import { hideToast, subscribeToast } from '@/lib/toast';
import type { Toast } from '@/lib/toast';

const TONES = {
    saved: {
        ring: 'shadow-[0_0_0_1.5px_rgb(34_197_94/0.7),0_14px_34px_rgb(0_0_0/0.35)]',
        badge: 'bg-green-500/20 text-green-500 dark:text-green-400',
        icon: <CheckIcon sx={{ fontSize: 17 }} />,
    },
    sent: {
        ring: 'shadow-[0_0_0_1.5px_rgb(22_144_200/0.85),0_14px_34px_rgb(0_0_0/0.35)]',
        badge: 'bg-hydra-blue/20 text-hydra-blue dark:text-sky-300',
        icon: <SendIcon sx={{ fontSize: 15 }} />,
    },
    deleted: {
        ring: 'shadow-[0_0_0_1px_rgb(239_68_68/0.45),0_14px_34px_rgb(0_0_0/0.35)]',
        badge: 'bg-red-500/20 text-red-500 dark:text-red-400',
        icon: <DeleteOutlineIcon sx={{ fontSize: 17 }} />,
    },
    error: {
        ring: 'shadow-[0_0_0_1px_rgb(239_68_68/0.45),0_14px_34px_rgb(0_0_0/0.35)]',
        badge: 'bg-red-500/20 text-red-500 dark:text-red-400',
        icon: <ErrorOutlineIcon sx={{ fontSize: 17 }} />,
    },
} as const;

/**
 * Shows the current toast at the bottom of the screen: above the phone's bottom
 * bar, bottom-left on a computer. It goes away by itself (an error waits for X)
 * and stays while the pointer or a finger is on it.
 */
export function ToastHost() {
    const [toast, setToast] = useState<Toast | null>(null);
    const [paused, setPaused] = useState(false);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => subscribeToast(setToast), []);

    useEffect(() => {
        window.clearTimeout(timer.current);

        if (!toast || paused || toast.tone === 'error') {
            return;
        }

        const id = toast.id;
        timer.current = window.setTimeout(
            () => hideToast(id),
            toast.undo ? 6000 : 4000,
        );

        return () => window.clearTimeout(timer.current);
    }, [toast, paused]);

    const tone = toast ? TONES[toast.tone] : null;

    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[1600] flex justify-center px-4 lg:bottom-6 lg:justify-start lg:px-6"
        >
            {toast && tone && (
                <div
                    key={toast.id}
                    role={toast.tone === 'error' ? 'alert' : 'status'}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onTouchStart={() => setPaused(true)}
                    onTouchEnd={() => setPaused(false)}
                    className={`pointer-events-auto flex min-h-[52px] w-full max-w-[358px] animate-[toast-in_180ms_ease-out] items-center gap-3 rounded-full bg-[#1b2a4a] py-2 pr-2 pl-3.5 text-[14.5px] font-semibold text-[#e8f1f8] motion-reduce:animate-none ${tone.ring}`}
                >
                    <span
                        className={`flex size-7 flex-none items-center justify-center rounded-full ${tone.badge}`}
                    >
                        {tone.icon}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                        {toast.message}
                    </span>
                    {toast.undo && (
                        <button
                            type="button"
                            onClick={() => {
                                toast.undo?.();
                                hideToast(toast.id);
                            }}
                            className="flex h-9 flex-none cursor-pointer items-center gap-1.5 rounded-full px-3 font-extrabold text-sky-300 hover:bg-white/10"
                        >
                            <UndoIcon sx={{ fontSize: 17 }} />
                            {t('Undo')}
                        </button>
                    )}
                    {(toast.tone === 'error' || !toast.undo) && (
                        <button
                            type="button"
                            aria-label={t('Close')}
                            onClick={() => hideToast(toast.id)}
                            className={`flex size-9 flex-none cursor-pointer items-center justify-center rounded-full bg-white/10 text-[#8aa0b8] hover:bg-white/15 ${toast.tone === 'error' ? '' : 'sr-only focus:not-sr-only'}`}
                        >
                            <CloseIcon sx={{ fontSize: 17 }} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
