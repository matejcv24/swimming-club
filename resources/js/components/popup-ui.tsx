import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import type { IconButtonProps } from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputBase from '@mui/material/InputBase';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import { useEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { POPUP_BG, POPUP_FG, popupFg } from '@/components/mui-theme-provider';
import { t } from '@/lib/i18n';

/**
 * Round icon "thumb" in the style of the light/dark toggle: navy with a light-blue
 * icon in dark mode, white with a club-blue icon in light mode.
 */
export function IconBadge({
    children,
    tone = 'brand',
    className = 'size-[38px]',
}: {
    children: ReactNode;
    tone?: 'brand' | 'red' | 'green';
    /** Size classes; 38px by default. */
    className?: string;
}) {
    const color =
        tone === 'red'
            ? 'text-red-500'
            : tone === 'green'
              ? 'text-green-500'
              : 'text-hydra-blue dark:text-sky-200';

    return (
        <span
            className={`flex ${className} flex-none items-center justify-center rounded-full bg-white shadow-[0_0_0_1px_#dbe7f0,0_2px_6px_rgba(0,16,49,0.12)] dark:bg-hydra-navy dark:shadow-[0_0_0_1px_rgb(186_230_253/0.14)] ${color}`}
        >
            {children}
        </span>
    );
}

/**
 * Says what a button does: on hover, and on a phone when the button is held for
 * a moment. A normal tap still just presses the button.
 */
export function Hint({
    title,
    children,
}: {
    title: string;
    children: ReactElement;
}) {
    return (
        <Tooltip
            title={title}
            arrow
            enterTouchDelay={400}
            leaveTouchDelay={2000}
        >
            {children}
        </Tooltip>
    );
}

/** Outlined text fields in the pop-up's colors, like the Group field. */
export const FIELD_SX = {
    '& .MuiOutlinedInput-root': {
        color: POPUP_FG,
        '& fieldset': { borderColor: popupFg(0.3) },
        '&:hover fieldset': { borderColor: popupFg(0.6) },
    },
    '& .MuiInputLabel-root': { color: popupFg(0.5) },
} as const;

/** The "add" button of a pop-up's header: just its icon, explained by a hint. */
export function AddButton({
    label,
    icon,
    onClick,
}: {
    label: string;
    icon: ReactNode;
    onClick: () => void;
}) {
    return (
        <Hint title={label}>
            <Button
                variant="contained"
                size="small"
                aria-label={label}
                onClick={onClick}
                sx={{ minWidth: 0, px: 1.25 }}
            >
                {icon}
            </Button>
        </Hint>
    );
}

/**
 * Under the latest month (or a year) of a history: opens the whole history, so
 * it's plain that there is more to see.
 */
export function ShowHistoryButton({
    label,
    onClick,
}: {
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={(event) => {
                // The row around it may open the same history: once is enough
                event.stopPropagation();
                onClick();
            }}
            className="inline-flex cursor-pointer items-center gap-1 py-1 text-[13px] font-semibold text-hydra-blue underline-offset-4 transition hover:underline dark:text-sky-300"
        >
            <HistoryIcon sx={{ fontSize: 17 }} />
            {label}
            <ChevronRightIcon sx={{ fontSize: 17 }} />
        </button>
    );
}

/** Soft round close button for every pop-up. */
export function CloseButton({ sx, ...props }: IconButtonProps) {
    return (
        <IconButton
            aria-label={t('Close')}
            {...props}
            sx={[
                {
                    width: 34,
                    height: 34,
                    bgcolor: 'var(--popup-ghost)',
                    color: 'var(--popup-muted)',
                    '&:hover': { bgcolor: 'var(--popup-ghost-hover)' },
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            <CloseIcon fontSize="small" />
        </IconButton>
    );
}

/**
 * One line of text that, when it is too long for its space (e.g. on phones), slowly
 * slides left to show the rest, pauses, and slides back, like a news ticker. Text
 * that fits stays still. Without motion (reduced-motion setting) it is cut with "…".
 */
export function SlidingText({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    const boxRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    // How far the text must move to show its end (0: it fits)
    const [distance, setDistance] = useState(0);

    useEffect(() => {
        const box = boxRef.current;
        const text = textRef.current;

        if (!box || !text) {
            return;
        }

        const measure = () =>
            setDistance(
                Math.max(0, Math.ceil(text.scrollWidth - box.clientWidth)),
            );

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(box);
        observer.observe(text);

        return () => observer.disconnect();
    }, [children]);

    const sliding = distance > 0;

    return (
        <div
            ref={boxRef}
            className={`overflow-hidden whitespace-nowrap motion-reduce:truncate ${className}`}
        >
            <span
                ref={textRef}
                className={`inline-block ${sliding ? 'animate-[sliding-text_var(--slide-time)_ease-in-out_infinite_alternate] motion-reduce:animate-none' : ''}`}
                style={
                    sliding
                        ? ({
                              '--slide-distance': `-${distance}px`,
                              // About 40px a second, plus the pauses at each end
                              '--slide-time': `${Math.max(4, distance / 40 + 3)}s`,
                          } as React.CSSProperties)
                        : undefined
                }
            >
                {children}
            </span>
        </div>
    );
}

/**
 * Header of every pop-up: icon badge (red for deleting and other dangerous
 * questions, or a person's avatar), title, who/when as the subtitle, actions
 * (e.g. the blue "+") and close.
 */
export function PopupHeader({
    icon,
    avatar,
    tone = 'brand',
    title,
    subtitle,
    actions,
    onClose,
}: {
    icon?: ReactNode;
    /** Shown instead of the icon badge, e.g. a member's initials. */
    avatar?: ReactNode;
    tone?: 'brand' | 'red' | 'green';
    title: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="flex items-center gap-3 px-[18px] pt-[18px] pb-3.5">
            {avatar ?? <IconBadge tone={tone}>{icon}</IconBadge>}
            <div className="min-w-0">
                {/* A long title slides on phones instead of being cut off */}
                <SlidingText className="text-[17px] leading-tight font-extrabold text-[var(--popup-fg)]">
                    {title}
                </SlidingText>
                {subtitle && (
                    <SlidingText className="mt-0.5 text-[12.5px] font-normal text-[var(--popup-muted)]">
                        {subtitle}
                    </SlidingText>
                )}
            </div>
            <div className="ml-auto flex flex-none items-center gap-2">
                {actions}
                <CloseButton onClick={onClose} />
            </div>
        </div>
    );
}

/** Pill-shaped search field, with an X to clear it while something is typed. */
export function PillSearchField({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <div className="px-[18px]">
            <InputBase
                fullWidth
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                startAdornment={<SearchIcon fontSize="small" />}
                // While something is typed: an X that clears it
                endAdornment={
                    value !== '' ? (
                        <IconButton
                            size="small"
                            aria-label={t('Clear')}
                            onClick={() => onChange('')}
                            sx={{ mr: -0.75, p: 0.5 }}
                        >
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    ) : undefined
                }
                inputProps={{ 'aria-label': placeholder }}
                sx={{
                    height: 40,
                    px: 1.75,
                    gap: 1,
                    borderRadius: 999,
                    bgcolor: 'var(--popup-ghost)',
                    border: '1px solid var(--popup-border)',
                    color: 'var(--popup-fg)',
                    fontSize: 14,
                    '& .MuiSvgIcon-root': { color: 'var(--popup-muted)' },
                    '& input::placeholder': {
                        color: 'var(--popup-muted)',
                        opacity: 1,
                    },
                    '&.Mui-focused': { borderColor: '#1690c8' },
                }}
            />
        </div>
    );
}

/** Small pill showing a member's pool. */
export function GroupChip({ name }: { name: string }) {
    return (
        <span className="rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-[11.5px] font-bold text-[var(--chip-fg)]">
            {name}
        </span>
    );
}

/**
 * The club's groups as the pill switch. Up to three share the width; more scroll
 * sideways. `counts` optionally adds a number per group, e.g. "Mon-Wed (3)".
 */
export function GroupTabs({
    groups,
    value,
    onChange,
    counts,
}: {
    groups: { id: number; name: string }[];
    value: number | null;
    onChange: (groupId: number) => void;
    counts?: Record<number, number>;
}) {
    if (groups.length === 0) {
        return null;
    }

    const selected = groups.some((group) => group.id === value)
        ? value
        : groups[0].id;

    return (
        <Tabs
            value={selected}
            onChange={(_, id: number) => onChange(id)}
            variant={groups.length <= 3 ? 'fullWidth' : 'scrollable'}
            scrollButtons={false}
        >
            {groups.map((group) => (
                <Tab
                    key={group.id}
                    value={group.id}
                    label={
                        counts
                            ? `${group.name} (${counts[group.id] ?? 0})`
                            : group.name
                    }
                />
            ))}
        </Tabs>
    );
}

/** Green (active) or red (inactive) dot with a label. */
export function StatusDot({ active }: { active: boolean }) {
    return (
        <span className="inline-flex items-center gap-1 text-xs text-[var(--popup-muted)]">
            <span
                className={`size-[7px] rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`}
            />
            {active ? t('Active') : t('Inactive')}
        </span>
    );
}

/**
 * The X inside a dropdown once something is chosen: back to nothing (or "All").
 * Give it to a Select as `endAdornment` only while there is something to clear.
 */
export function SelectClear({ onClear }: { onClear: () => void }) {
    return (
        <InputAdornment position="end" sx={{ mr: 2.5 }}>
            <IconButton
                size="small"
                aria-label={t('Clear')}
                // Not opening the dropdown: only clearing it
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    onClear();
                }}
                sx={{ color: 'var(--popup-muted)', p: 0.5 }}
            >
                <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
        </InputAdornment>
    );
}

/** A pop-up's buttons: Cancel on the left, the action on the right, same width. */
export function PopupButtons({ children }: { children: ReactNode }) {
    return (
        <div className="grid grid-cols-2 gap-3 px-[18px] pt-2 pb-[18px] [&>*:only-child]:col-span-2">
            {children}
        </div>
    );
}

/**
 * The one way to ask before something is deleted or switched off: a red badge,
 * the question as the title ("Delete member?"), who or what as the subtitle,
 * one short paragraph, then Cancel / [the verb].
 */
export function ConfirmDialog({
    open,
    icon,
    title,
    subtitle,
    children,
    confirmLabel,
    busy = false,
    confirmDisabled = false,
    tone = 'red',
    onConfirm,
    onClose,
}: {
    open: boolean;
    icon: ReactNode;
    title: string;
    subtitle?: ReactNode;
    children?: ReactNode;
    confirmLabel: string;
    busy?: boolean;
    /** The action can't be done yet (e.g. a choice is missing); Cancel still works. */
    confirmDisabled?: boolean;
    /** Blue for a question that loses nothing (e.g. activate again). */
    tone?: 'red' | 'brand';
    onConfirm: () => void;
    onClose: () => void;
}) {
    return (
        <Dialog
            open={open}
            onClose={() => !busy && onClose()}
            disableRestoreFocus
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { bgcolor: POPUP_BG } }}
        >
            <PopupHeader
                icon={icon}
                tone={tone}
                title={title}
                subtitle={subtitle}
                onClose={() => !busy && onClose()}
            />
            {children && (
                <div className="flex flex-col gap-3 px-[18px] pb-2 text-sm text-[var(--popup-fg)]/80">
                    {children}
                </div>
            )}
            <PopupButtons>
                <Button variant="outlined" onClick={onClose} disabled={busy}>
                    {t('Cancel')}
                </Button>
                <Button
                    variant="contained"
                    color={tone === 'red' ? 'error' : 'primary'}
                    onClick={onConfirm}
                    disabled={busy || confirmDisabled}
                >
                    {confirmLabel}
                </Button>
            </PopupButtons>
        </Dialog>
    );
}

export type MenuAction = {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    /** Blue for the main action, red (and last) for deleting. */
    tone?: 'primary' | 'default' | 'danger';
    hidden?: boolean;
};

/**
 * A small pop-up with what was tapped at the top and its actions below, 48px
 * each: the main one blue, deleting red and last. The same for payments,
 * salaries, invoices, members and staff.
 */
export function ActionMenu({
    open,
    title,
    subtitle,
    actions,
    onClose,
}: {
    open: boolean;
    title: string;
    subtitle?: ReactNode;
    actions: MenuAction[];
    onClose: () => void;
}) {
    const color = {
        primary:
            'text-hydra-blue hover:bg-[var(--popup-ghost)] dark:text-sky-300',
        default: 'text-[var(--popup-fg)] hover:bg-[var(--popup-ghost)]',
        danger: 'text-red-500 hover:bg-red-500/10',
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            disableRestoreFocus
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { bgcolor: POPUP_BG } }}
        >
            <div className="flex items-start justify-between gap-3 px-[18px] pt-[18px] pb-2">
                <div className="min-w-0">
                    <p className="text-[15px] font-extrabold text-[var(--popup-fg)]">
                        {title}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-[var(--popup-muted)]">
                            {subtitle}
                        </p>
                    )}
                </div>
                <CloseButton onClick={onClose} />
            </div>
            <div className="flex flex-col px-2 pb-3">
                {actions
                    .filter((action) => !action.hidden)
                    .map((action) => (
                        <button
                            key={action.label}
                            type="button"
                            onClick={() => {
                                onClose();
                                action.onClick();
                            }}
                            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-t border-[var(--popup-border)] px-3 text-left font-semibold ${color[action.tone ?? 'default']}`}
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    ))}
            </div>
        </Dialog>
    );
}

/**
 * A year in a history: a thin strip across the whole width with the count and
 * total on the right. Tapping it opens or closes the year; only the current
 * year starts open.
 */
export function YearSection({
    year,
    summary,
    defaultOpen,
    children,
}: {
    year: string;
    summary?: ReactNode;
    defaultOpen?: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(
        defaultOpen ?? year === String(new Date().getFullYear()),
    );

    return (
        <li>
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="flex w-full cursor-pointer items-center gap-2 border-b border-[var(--popup-border)] bg-[var(--popup-ghost)] px-[18px] py-2 text-left text-[12.5px] font-bold text-[var(--popup-fg)]/80"
            >
                <span className="flex-1">{year}</span>
                {summary && (
                    <span className="font-semibold text-[var(--popup-muted)]">
                        {summary}
                    </span>
                )}
                <ExpandMoreIcon
                    sx={{ fontSize: 18 }}
                    className={`text-[var(--popup-muted)] transition-transform ${open ? '' : '-rotate-90'}`}
                />
            </button>
            {open && <ul>{children}</ul>}
        </li>
    );
}

/** A form's section title: small capitals, grey ("ENTER A NEW PAYMENT"). */
export function SectionLabel({ children }: { children: ReactNode }) {
    return (
        <p className="m-0 text-xs font-bold tracking-[1px] text-[var(--popup-muted)] uppercase">
            {children}
        </p>
    );
}

/**
 * Top of a history: one bold sentence and one line of numbers. Green = all
 * good, red = late or a loss, blue = information only.
 */
export function SummaryCard({
    tone,
    title,
    children,
}: {
    tone: 'green' | 'red' | 'blue';
    title: ReactNode;
    children?: ReactNode;
}) {
    const colors = {
        green: 'bg-green-500/15 text-green-800 dark:text-green-200',
        red: 'bg-red-500/10 text-red-700 dark:text-red-300',
        blue: 'bg-hydra-blue/15 text-hydra-navy dark:text-sky-200',
    };

    return (
        <div
            className={`mx-[18px] mb-3 rounded-xl px-3 py-2.5 text-sm ${colors[tone]}`}
        >
            <p className="font-bold">{title}</p>
            {children && <p>{children}</p>}
        </div>
    );
}

/** Nothing to show: a badge, one bold sentence and a line of explanation. */
export function EmptyState({
    icon,
    title,
    text,
    tone = 'brand',
    action,
}: {
    icon: ReactNode;
    title: string;
    text?: string;
    tone?: 'brand' | 'green';
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-2 px-[18px] pt-5 pb-7 text-center">
            <IconBadge tone={tone} className="size-12">
                {icon}
            </IconBadge>
            <p className="mt-1 font-bold text-[var(--popup-fg)]">{title}</p>
            {text && (
                <p className="text-sm text-[var(--popup-muted)]">{text}</p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

/**
 * A note inside a pop-up, always with its icon: blue a tip, yellow something
 * missing, green it worked, red it can't be undone (or it failed).
 */
export function Note({
    tone,
    children,
    className = '',
}: {
    tone: 'info' | 'warn' | 'success' | 'error';
    children: ReactNode;
    className?: string;
}) {
    const styles = {
        info: 'bg-hydra-blue/15 text-hydra-navy dark:text-sky-200',
        warn: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
        success: 'bg-green-500/15 text-green-800 dark:text-green-200',
        error: 'bg-red-500/10 text-red-700 dark:text-red-300',
    };
    const icons = {
        info: <InfoOutlinedIcon sx={{ fontSize: 17 }} />,
        warn: <WarningAmberIcon sx={{ fontSize: 17 }} />,
        success: <CheckCircleOutlineIcon sx={{ fontSize: 17 }} />,
        error: <ErrorOutlineIcon sx={{ fontSize: 17 }} />,
    };

    return (
        <div
            className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${styles[tone]} ${className}`}
        >
            <span className="mt-px flex-none">{icons[tone]}</span>
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

/**
 * A month or year that opens more: title and count on the left, the total on
 * the right, > at the end. The same height as a history row.
 */
export function DrillRow({
    title,
    subtitle,
    value,
    valueClassName = 'text-[var(--popup-fg)]',
    onClick,
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    value?: ReactNode;
    valueClassName?: string;
    onClick: () => void;
}) {
    return (
        <li className="border-b border-[var(--popup-border)]">
            <button
                type="button"
                onClick={onClick}
                className="flex w-full cursor-pointer items-center gap-3 px-[18px] py-3 text-left transition hover:bg-[var(--popup-ghost)]"
            >
                <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[var(--popup-fg)]">
                        {title}
                    </span>
                    {subtitle && (
                        <span className="mt-0.5 block text-[13px] text-[var(--popup-muted)]">
                            {subtitle}
                        </span>
                    )}
                </span>
                {value !== undefined && (
                    <span
                        className={`flex-none text-right text-[15px] font-bold whitespace-nowrap ${valueClassName}`}
                    >
                        {value}
                    </span>
                )}
                <ChevronRightIcon
                    fontSize="small"
                    className="flex-none text-[var(--popup-muted)]"
                />
            </button>
        </li>
    );
}

/** A tappable tile (a training's time slot): small label, big name, status. */
export function Tile({
    label,
    name,
    status,
    statusTone = 'muted',
    wide = false,
    onClick,
}: {
    label?: string;
    name: string;
    status?: string;
    statusTone?: 'muted' | 'green';
    wide?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex min-h-[72px] cursor-pointer flex-col items-start justify-center gap-0.5 rounded-[14px] bg-[var(--popup-ghost)] px-3.5 py-3 text-left shadow-[inset_0_0_0_1px_var(--popup-border)] transition hover:shadow-[inset_0_0_0_1.5px_#1690c8] ${wide ? 'col-span-2' : ''}`}
        >
            {label && (
                <span className="text-[13px] font-semibold text-[var(--popup-muted)]">
                    {label}
                </span>
            )}
            <span
                className={`leading-tight font-extrabold text-[var(--popup-fg)] ${wide ? 'text-base' : 'text-xl'}`}
            >
                {name}
            </span>
            {status && (
                <span
                    className={`text-[12.5px] ${statusTone === 'green' ? 'font-bold text-green-600 dark:text-green-400' : 'text-[var(--popup-muted)]'}`}
                >
                    {status}
                </span>
            )}
        </button>
    );
}

/** Avatars in a list alternate between club blue and navy. */
export const avatarSx = (index: number) =>
    index % 2 === 0
        ? {}
        : {
              bgcolor: '#001031',
              color: '#bae6fd',
              boxShadow: '0 0 0 1px rgba(186, 230, 253, 0.25)',
          };
