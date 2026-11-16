import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import type { IconButtonProps } from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { t } from '@/lib/i18n';
import { clearOnClick } from '@/lib/search-field';

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

/** Header of a main pop-up: icon badge, title, short summary, actions and close. */
export function PopupHeader({
    icon,
    title,
    subtitle,
    actions,
    onClose,
}: {
    icon: ReactNode;
    title: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="flex items-center gap-3 px-[18px] pt-[18px] pb-3.5">
            <IconBadge>{icon}</IconBadge>
            <div className="min-w-0">
                <div className="truncate text-[17px] leading-tight font-extrabold text-[var(--popup-fg)]">
                    {title}
                </div>
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

/** Pill-shaped search field. Clicking it again clears the last search. */
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
                {...clearOnClick(value !== '', () => onChange(''))}
                placeholder={placeholder}
                startAdornment={<SearchIcon fontSize="small" />}
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

/** Avatars in a list alternate between club blue and navy. */
export const avatarSx = (index: number) =>
    index % 2 === 0
        ? {}
        : {
              bgcolor: '#001031',
              color: '#bae6fd',
              boxShadow: '0 0 0 1px rgba(186, 230, 253, 0.25)',
          };
