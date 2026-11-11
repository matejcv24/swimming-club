import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import type { IconButtonProps } from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import type { ReactNode } from 'react';
import { clearOnClick } from '@/lib/search-field';

/**
 * Round icon "thumb" in the style of the light/dark toggle: navy with a light-blue
 * icon in dark mode, white with a club-blue icon in light mode.
 */
export function IconBadge({
    children,
    tone = 'brand',
}: {
    children: ReactNode;
    tone?: 'brand' | 'red' | 'green';
}) {
    const color =
        tone === 'red'
            ? 'text-red-500'
            : tone === 'green'
              ? 'text-green-500'
              : 'text-hydra-blue dark:text-sky-200';

    return (
        <span
            className={`flex size-[38px] flex-none items-center justify-center rounded-full bg-white shadow-[0_0_0_1px_#dbe7f0,0_2px_6px_rgba(0,16,49,0.12)] dark:bg-hydra-navy dark:shadow-[0_0_0_1px_rgb(186_230_253/0.14)] ${color}`}
        >
            {children}
        </span>
    );
}

/** Soft round close button for every pop-up. */
export function CloseButton({ sx, ...props }: IconButtonProps) {
    return (
        <IconButton
            aria-label="Close"
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
                    <div className="mt-0.5 truncate text-[12.5px] font-normal text-[var(--popup-muted)]">
                        {subtitle}
                    </div>
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
export function PoolChip({ pool }: { pool: string }) {
    return (
        <span className="rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-[11.5px] font-bold text-[var(--chip-fg)]">
            {pool === 'big' ? 'Big pool' : 'Small pool'}
        </span>
    );
}

/** Green (active) or red (inactive) dot with a label. */
export function StatusDot({ active }: { active: boolean }) {
    return (
        <span className="inline-flex items-center gap-1 text-xs text-[var(--popup-muted)]">
            <span
                className={`size-[7px] rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`}
            />
            {active ? 'Active' : 'Inactive'}
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
