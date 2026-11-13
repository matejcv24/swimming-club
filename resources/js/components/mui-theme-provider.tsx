import type { Components, Theme } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { useAppearance } from '@/hooks/use-appearance';

/**
 * Pop-up background for MUI dialogs. A CSS variable (see app.css), so it follows the
 * light/dark switch: white in light mode, navy in dark mode.
 */
export const POPUP_BG = 'var(--popup-bg)';

/** Pop-up text color, and the same color at an opacity (for hovers, borders, muted text). */
export const POPUP_FG = 'var(--popup-fg)';
export const popupFg = (opacity: number) =>
    `rgb(var(--popup-fg-rgb) / ${opacity})`;

const HYDRA_BLUE = '#1690c8';

// The club's look for every pop-up, following the light/dark toggle's pattern:
// club blue, pill shapes, round "thumbs". Colors come from app.css variables.
const components: Components<Theme> = {
    // Slightly blur whatever is behind a pop-up (the dashboard). Invisible backdrops,
    // e.g. behind dropdown menus, stay clear.
    MuiBackdrop: {
        styleOverrides: {
            root: ({ ownerState }) =>
                ownerState.invisible ? {} : { backdropFilter: 'blur(3px)' },
        },
    },
    MuiDialog: {
        styleOverrides: {
            paper: {
                borderRadius: 20,
                backgroundImage: 'none',
                border: '1px solid var(--popup-border)',
            },
        },
    },
    MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
            root: { borderRadius: 999, textTransform: 'none', fontWeight: 700 },
        },
    },
    // Edit, delete, add...: soft round buttons
    MuiIconButton: {
        styleOverrides: {
            colorPrimary: {
                backgroundColor: 'var(--popup-ghost)',
                '&:hover': { backgroundColor: 'var(--popup-ghost-hover)' },
            },
            colorError: {
                backgroundColor: 'var(--popup-ghost)',
                '&:hover': { backgroundColor: 'var(--popup-ghost-hover)' },
            },
        },
    },
    // Tabs (Active/Inactive, Big pool/Small pool) as a pill switch like the theme toggle
    MuiTabs: {
        styleOverrides: {
            root: {
                minHeight: 40,
                margin: '10px 16px',
                padding: 3,
                borderRadius: 999,
                backgroundColor: 'var(--seg-track)',
            },
            indicator: {
                height: '100%',
                bottom: 0,
                borderRadius: 999,
                backgroundColor: 'var(--seg-on)',
                boxShadow: '0 2px 5px rgba(0, 16, 49, 0.25)',
                zIndex: 0,
            },
        },
    },
    MuiTab: {
        styleOverrides: {
            root: {
                zIndex: 1,
                minHeight: 34,
                padding: '6px 12px',
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--popup-muted)',
                opacity: 1,
                '&.Mui-selected': { color: 'var(--seg-on-fg)' },
            },
            textColorInherit: { opacity: 1 },
        },
    },
    MuiAvatar: {
        styleOverrides: {
            colorDefault: {
                backgroundColor: HYDRA_BLUE,
                color: '#fff',
                fontWeight: 800,
            },
        },
    },
    MuiChip: {
        styleOverrides: { root: { fontWeight: 700 } },
    },
};

const shared = {
    shape: { borderRadius: 12 },
    typography: {
        fontFamily:
            "'Instrument Sans Variable', 'Instrument Sans', ui-sans-serif, system-ui, sans-serif",
    },
    components,
};

const themes = {
    light: createTheme({
        ...shared,
        palette: {
            mode: 'light',
            primary: { main: HYDRA_BLUE, contrastText: '#fff' },
        },
    }),
    dark: createTheme({
        ...shared,
        palette: {
            mode: 'dark',
            primary: { main: HYDRA_BLUE, contrastText: '#fff' },
            background: { default: '#060d1f', paper: '#0f1b36' },
        },
    }),
};

/** MUI theme that follows the app's light/dark switch. */
export function MuiThemeProvider({ children }: { children: ReactNode }) {
    const { resolvedAppearance } = useAppearance();

    return (
        <ThemeProvider theme={themes[resolvedAppearance]}>
            {children}
        </ThemeProvider>
    );
}
