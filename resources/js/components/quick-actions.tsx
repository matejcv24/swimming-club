import { Link, router } from '@inertiajs/react';
import AddCardIcon from '@mui/icons-material/AddCard';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Dialog from '@mui/material/Dialog';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { MuiThemeProvider, POPUP_BG } from '@/components/mui-theme-provider';
import { CloseButton, IconBadge } from '@/components/popup-ui';
import { useGroups } from '@/lib/groups';
import { t } from '@/lib/i18n';

/** A place attendance is recorded for: a group, or one of its subgroups. */
interface AttendanceTarget {
    key: string;
    label: string;
    groupId: number;
    subgroupId: number | null;
}

/**
 * Where attendance can be recorded: each group without subgroups, and each
 * subgroup of the others (a whole group with subgroups is read-only).
 */
function useAttendanceTargets(): AttendanceTarget[] {
    const groups = useGroups();

    return groups.flatMap<AttendanceTarget>((group) =>
        group.subgroups.length === 0
            ? [
                  {
                      key: `g${group.id}`,
                      label: group.name,
                      groupId: group.id,
                      subgroupId: null,
                  },
              ]
            : group.subgroups.map((subgroup) => ({
                  key: `s${subgroup.id}`,
                  label: `${group.name} · ${subgroup.name}`,
                  groupId: group.id,
                  subgroupId: subgroup.id,
              })),
    );
}

/** Today's training of a group, opened ready to tick who came. */
function openTodaysAttendance(target: AttendanceTarget) {
    const params = new URLSearchParams({
        date: dayjs().format('YYYY-MM-DD'),
        group: String(target.groupId),
        attendance: '1',
        quick: '1',
    });

    if (target.subgroupId !== null) {
        params.set('subgroup', String(target.subgroupId));
    }

    router.visit(`/trainings?${params}`);
}

/**
 * The dashboard's shortcuts, each opening the pop-up that already does the job.
 * "Add attendance" first asks for the group, unless there's only one.
 */
function useQuickActions() {
    const targets = useAttendanceTargets();
    const [picking, setPicking] = useState(false);

    const addAttendance = () => {
        if (targets.length === 1) {
            openTodaysAttendance(targets[0]);
        } else {
            setPicking(true);
        }
    };

    const actions: {
        key: string;
        icon: ReactNode;
        label: string;
        /** Under the icon in the phone bar */
        short: string;
        /** The phone bar's colored circle: background and icon color */
        tint: string;
        href?: string;
        onClick?: () => void;
    }[] = [
        {
            key: 'attendance',
            icon: <EventAvailableIcon fontSize="inherit" />,
            label: t('Add attendance'),
            short: t('Attendance'),
            tint: 'bg-hydra-blue/15 text-hydra-blue dark:bg-sky-400/20 dark:text-sky-300',
            onClick: addAttendance,
        },
        {
            key: 'member',
            icon: <PersonAddAlt1Icon fontSize="inherit" />,
            label: t('Add member'),
            short: t('Member'),
            tint: 'bg-violet-500/15 text-violet-600 dark:bg-violet-400/20 dark:text-violet-300',
            href: '/members?add=1',
        },
        {
            key: 'payment',
            icon: <AddCardIcon fontSize="inherit" />,
            label: t('Add payment'),
            short: t('Payment'),
            tint: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300',
            href: '/membership-fees?add=1',
        },
    ];

    const picker = (
        <GroupPicker
            open={picking}
            targets={targets}
            onClose={() => setPicking(false)}
        />
    );

    return { actions, picker };
}

/** "Which group is the attendance for?": one button per group or subgroup. */
function GroupPicker({
    open,
    targets,
    onClose,
}: {
    open: boolean;
    targets: AttendanceTarget[];
    onClose: () => void;
}) {
    return (
        <MuiThemeProvider>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <div className="flex flex-col gap-4 p-5">
                    <div className="flex items-center gap-3">
                        <IconBadge>
                            <EventAvailableIcon fontSize="small" />
                        </IconBadge>
                        <div className="min-w-0 flex-1">
                            <p className="text-base font-bold text-[var(--popup-fg)]">
                                {t('Which group is the attendance for?')}
                            </p>
                            <p className="text-sm text-[var(--popup-muted)]">
                                {dayjs().format('DD.MM.YYYY')}
                            </p>
                        </div>
                        <CloseButton onClick={onClose} />
                    </div>
                    <div className="flex flex-col gap-2">
                        {targets.map((target) => (
                            <button
                                key={target.key}
                                type="button"
                                onClick={() => {
                                    onClose();
                                    openTodaysAttendance(target);
                                }}
                                className="cursor-pointer rounded-xl border border-[var(--popup-border)] px-4 py-3 text-left font-semibold text-[var(--popup-fg)] transition hover:border-hydra-blue hover:bg-hydra-blue/10"
                            >
                                {target.label}
                            </button>
                        ))}
                        {targets.length === 0 && (
                            <p className="text-sm text-[var(--popup-muted)]">
                                {t('No groups yet. Ask an admin to add one.')}
                            </p>
                        )}
                    </div>
                </div>
            </Dialog>
        </MuiThemeProvider>
    );
}

/** One shortcut: a link, or a button for the actions that ask first. */
function ActionButton({
    action,
    className,
    children,
}: {
    action: ReturnType<typeof useQuickActions>['actions'][number];
    className: string;
    children: ReactNode;
}) {
    return action.href ? (
        <Link
            href={action.href}
            prefetch={['mount', 'hover']}
            cacheFor={['30s', '10m']}
            aria-label={action.label}
            className={className}
        >
            {children}
        </Link>
    ) : (
        <button
            type="button"
            onClick={action.onClick}
            aria-label={action.label}
            className={`cursor-pointer ${className}`}
        >
            {children}
        </button>
    );
}

/** Wide screens (laptops and up): the phone bar's buttons, in a row in the top bar. */
export function QuickActionsTopBar() {
    const { actions, picker } = useQuickActions();

    return (
        <nav
            aria-label={t('Quick actions')}
            className="mr-2 hidden items-center gap-1.5 lg:flex"
        >
            {actions.map((action) => (
                <ActionButton
                    key={action.key}
                    action={action}
                    className="flex h-9 items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-semibold text-hydra-navy transition hover:bg-black/5 dark:text-[#e8eefb] dark:hover:bg-white/10"
                >
                    {/* The same colored circle as in the phone bar */}
                    <span
                        className={`flex size-7 items-center justify-center rounded-full text-[17px] ${action.tint}`}
                    >
                        {action.icon}
                    </span>
                    {action.short}
                </ActionButton>
            ))}
            {picker}
        </nav>
    );
}

/**
 * Whether the page is being scrolled down (away from the top): the phone bar then
 * shrinks a little, and grows back as soon as the page is scrolled up again.
 */
function useScrollingDown(): boolean {
    const [down, setDown] = useState(false);

    useEffect(() => {
        let last = window.scrollY;

        const onScroll = () => {
            const y = window.scrollY;

            // Small jitters (and the bounce at the ends) don't count
            if (Math.abs(y - last) < 6) {
                return;
            }

            setDown(y > last && y > 24);
            last = y;
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return down;
}

/**
 * Phones and tablets: a floating bar fixed to the bottom of the dashboard, each
 * action a colored circle with its name under it. While scrolling down it gets
 * a little smaller (names hidden); scrolling up brings it back.
 */
export function QuickActionsBar() {
    const { actions, picker } = useQuickActions();
    const compact = useScrollingDown();

    return (
        <nav
            aria-label={t('Quick actions')}
            className={`fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 grid -translate-x-1/2 grid-cols-3 rounded-[22px] border border-white/70 bg-white/80 shadow-[0_8px_32px_rgba(0,16,49,0.18)] backdrop-blur-xl transition-all duration-300 ease-out lg:hidden dark:border-[#2a3a5c] dark:bg-[#16223f]/90 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${
                compact
                    ? 'w-[min(62%,16rem)] px-1 py-1.5'
                    : 'w-[min(88%,22rem)] px-1 pt-2 pb-1.5'
            }`}
        >
            {actions.map((action) => (
                <ActionButton
                    key={action.key}
                    action={action}
                    className="flex flex-col items-center rounded-2xl transition active:scale-95"
                >
                    <span
                        className={`flex items-center justify-center rounded-full transition-all duration-300 ease-out ${action.tint} ${
                            compact
                                ? 'size-9 text-[20px]'
                                : 'size-11 text-[24px]'
                        }`}
                    >
                        {action.icon}
                    </span>
                    <span
                        className={`overflow-hidden text-[11px] leading-tight font-semibold text-hydra-navy transition-all duration-300 ease-out dark:text-[#e8eefb] ${
                            compact
                                ? 'max-h-0 opacity-0'
                                : 'mt-1 max-h-5 opacity-100'
                        }`}
                    >
                        {action.short}
                    </span>
                </ActionButton>
            ))}
            {picker}
        </nav>
    );
}

/** Room under the dashboard's last card, so the bar never hides it. */
export function QuickActionsSpacer() {
    return (
        <div
            aria-hidden
            className="h-[calc(5rem+env(safe-area-inset-bottom))] shrink-0 lg:hidden"
        />
    );
}
