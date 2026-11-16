import Dialog from '@mui/material/Dialog';
import { POPUP_BG } from '@/components/mui-theme-provider';
import { POPUP_FADE } from '@/hooks/use-page-popup';
import { t } from '@/lib/i18n';

/**
 * Grey placeholder shapes shown while data is on its way (slow internet), so
 * people see the layout coming instead of an empty pop-up. They pulse gently,
 * and stay still for people who turned motion off.
 */
export function Bone({ className = '' }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={`animate-pulse rounded-md bg-[var(--popup-ghost)] motion-reduce:animate-none ${className}`}
        />
    );
}

/** Rows like the members lists: a round avatar, a name and a short line under it. */
export function ListSkeleton({
    rows = 6,
    avatar = true,
}: {
    rows?: number;
    avatar?: boolean;
}) {
    return (
        <div role="status" aria-label={t('Loading')} className="flex flex-col">
            {Array.from({ length: rows }, (_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-4 border-b border-[var(--popup-border)] px-[18px] py-3"
                >
                    {avatar && (
                        <Bone className="size-10 flex-none rounded-full" />
                    )}
                    <div className="flex flex-1 flex-col gap-2">
                        {/* Varying widths so it looks like real names */}
                        <Bone
                            className={`h-3.5 ${['w-2/5', 'w-1/2', 'w-1/3'][index % 3]}`}
                        />
                        <Bone className="h-3 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Rounded boxes like the history cards (a year, a month, a payment). */
export function CardsSkeleton({ cards = 3 }: { cards?: number }) {
    return (
        <div
            role="status"
            aria-label={t('Loading')}
            className="flex flex-col gap-2.5"
        >
            {Array.from({ length: cards }, (_, index) => (
                <Bone key={index} className="h-14 w-full rounded-xl" />
            ))}
        </div>
    );
}

/**
 * A pop-up's frame (header, a field and list rows) shown at once when a dashboard
 * card is tapped, until the page arrives.
 */
export function PopupSkeleton({
    open,
    title,
}: {
    open: boolean;
    title: string;
}) {
    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth="sm"
            transitionDuration={{ enter: POPUP_FADE.enter, exit: 0 }}
            PaperProps={{
                sx: {
                    bgcolor: POPUP_BG,
                    height: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <div className="flex items-center gap-3 px-[18px] pt-[18px] pb-3.5">
                <Bone className="size-[38px] flex-none rounded-xl" />
                <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="truncate text-[17px] leading-tight font-extrabold text-[var(--popup-fg)]">
                        {title}
                    </span>
                    <Bone className="h-3 w-28" />
                </div>
            </div>
            <div className="px-[18px] pb-3">
                <Bone className="h-10 w-full rounded-full" />
            </div>
            <div className="flex-1 overflow-hidden">
                <ListSkeleton rows={7} />
            </div>
        </Dialog>
    );
}
