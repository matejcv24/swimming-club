import { Link, router } from '@inertiajs/react';
import AddCardIcon from '@mui/icons-material/AddCard';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Dialog from '@mui/material/Dialog';
import dayjs from 'dayjs';
import { useState } from 'react';
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
        href?: string;
        onClick?: () => void;
    }[] = [
        {
            key: 'attendance',
            icon: <EventAvailableIcon fontSize="inherit" />,
            label: t('Add attendance'),
            onClick: addAttendance,
        },
        {
            key: 'member',
            icon: <PersonAddAlt1Icon fontSize="inherit" />,
            label: t('Add member'),
            href: '/members?add=1',
        },
        {
            key: 'payment',
            icon: <AddCardIcon fontSize="inherit" />,
            label: t('Add payment'),
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
        <Link href={action.href} prefetch className={className}>
            {children}
        </Link>
    ) : (
        <button
            type="button"
            onClick={action.onClick}
            className={`cursor-pointer ${className}`}
        >
            {children}
        </button>
    );
}

/** Wide screens (laptops and up): small buttons in the top bar. */
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
                    className="flex h-8 items-center gap-1.5 rounded-full border border-hydra-blue/30 px-3 text-sm font-semibold text-hydra-blue transition hover:bg-hydra-blue/10 dark:border-sky-200/25 dark:text-sky-100 dark:hover:bg-sky-200/10 [&_svg]:text-[18px]"
                >
                    {action.icon}
                    {action.label}
                </ActionButton>
            ))}
            {picker}
        </nav>
    );
}

/**
 * Phones and tablets: a frosted-glass bar fixed to the bottom of the dashboard,
 * above the iPhone home line. The dashboard leaves room under its last card.
 */
export function QuickActionsBar() {
    const { actions, picker } = useQuickActions();

    return (
        <nav
            aria-label={t('Quick actions')}
            className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-3 rounded-2xl border border-white/60 bg-white/55 p-1.5 shadow-[0_8px_32px_rgba(0,16,49,0.18)] backdrop-blur-xl backdrop-saturate-150 lg:hidden dark:border-white/15 dark:bg-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
        >
            {actions.map((action) => (
                <ActionButton
                    key={action.key}
                    action={action}
                    className="flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-center text-[11.5px] leading-tight font-semibold text-hydra-navy transition active:scale-95 active:bg-white/40 dark:text-white dark:active:bg-white/10 [&_svg]:text-[22px] [&_svg]:text-hydra-blue dark:[&_svg]:text-sky-300"
                >
                    {action.icon}
                    {action.label}
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
            className="h-[calc(5.5rem+env(safe-area-inset-bottom))] shrink-0 lg:hidden"
        />
    );
}
