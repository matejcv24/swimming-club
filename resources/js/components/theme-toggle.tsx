import { usePage } from '@inertiajs/react';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import { useEffect } from 'react';
import { syncAppearance, useAppearance } from '@/hooks/use-appearance';
import type { User } from '@/types';

const ThemeSwitch = styled(Switch)({
    width: 58,
    height: 34,
    padding: 7,
    '& .MuiSwitch-switchBase': {
        margin: 1,
        padding: 0,
        transform: 'translateX(4px)',
        '&.Mui-checked': {
            transform: 'translateX(22px)',
            '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: '#1690c8',
            },
        },
    },
    '& .MuiSwitch-track': {
        opacity: 1,
        borderRadius: 10,
        backgroundColor: '#c5dceb',
    },
});

// The round thumb that slides: a sun in light mode, a moon in dark mode
function Thumb({ dark }: { dark: boolean }) {
    return (
        <span
            className={`mt-px flex size-8 items-center justify-center rounded-full shadow-md ${
                dark ? 'bg-hydra-navy text-sky-200' : 'bg-white text-amber-500'
            }`}
        >
            {dark ? (
                <DarkModeIcon sx={{ fontSize: 18 }} />
            ) : (
                <LightModeIcon sx={{ fontSize: 18 }} />
            )}
        </span>
    );
}

// The user whose saved choice is already applied. On a full page load that's the user the
// server rendered the page for (empty for the login page); reset on logout.
let syncedUserId: number | null =
    typeof document !== 'undefined' &&
    document.documentElement.dataset.appearanceUser
        ? Number(document.documentElement.dataset.appearanceUser)
        : null;

export function forgetThemeUser(): void {
    syncedUserId = null;
}

export function ThemeToggle() {
    const { auth } = usePage().props as { auth?: { user?: User | null } };
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const savedAppearance = auth?.user?.appearance;
    const isDark = resolvedAppearance === 'dark';

    // When someone logs in without a full page reload, apply their saved choice once.
    // Only then: older page data (e.g. from the Back button) must not undo a toggle.
    useEffect(() => {
        const userId = auth?.user?.id;

        if (userId !== undefined && userId !== syncedUserId) {
            syncedUserId = userId;

            if (savedAppearance) {
                syncAppearance(savedAppearance);
            }
        }
    }, [auth?.user?.id, savedAppearance]);

    return (
        <Tooltip
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <ThemeSwitch
                checked={isDark}
                onChange={(e) =>
                    updateAppearance(e.target.checked ? 'dark' : 'light')
                }
                icon={<Thumb dark={false} />}
                checkedIcon={<Thumb dark />}
                slotProps={{
                    input: {
                        'aria-label': isDark
                            ? 'Dark mode on. Switch to light mode'
                            : 'Light mode on. Switch to dark mode',
                    },
                }}
            />
        </Tooltip>
    );
}
