import { Head, Link, router } from '@inertiajs/react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import type { PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Fragment, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import { MemberDetailsDialog } from '@/components/member-details-dialog';
import type { MemberDetails } from '@/components/member-details-dialog';
import {
    MuiThemeProvider,
    POPUP_BG,
    POPUP_FG,
    popupFg,
} from '@/components/mui-theme-provider';
import {
    avatarSx,
    IconBadge,
    Note,
    PillSearchField,
    PopupHeader,
    SectionLabel,
    Tile,
} from '@/components/popup-ui';
import { ListSkeleton } from '@/components/skeletons';
import { usePagePopup } from '@/hooks/use-page-popup';
import { groupWithSubgroupName, useGroups } from '@/lib/groups';
import type { ClubGroup } from '@/lib/groups';
import { locale, pickerLocaleText, t, tc } from '@/lib/i18n';
import { showToast } from '@/lib/toast';

interface Member {
    id: number;
    name: string;
    group_id: number | null;
    subgroup_id: number | null;
}

/** Who came to one subgroup's (or the whole group's) training on a day. */
interface DaySection {
    /** None: recorded for every member (a club without groups) */
    group_id: number | null;
    group_name: string | null;
    subgroup_id: number | null;
    name: string | null;
    members: MemberDetails[];
}

interface Props {
    members: Member[];
    canManageGroups: boolean;
    canSeeAllGroups: boolean;
}

/**
 * What is chosen: 'all' (every group, read-only), 'g:ID' (a group; with
 * subgroups, a read-only overview of them), 's:ID' (one of its subgroups) or ''
 * (nothing chosen yet).
 */
type Choice = string;

const groupChoice = (groupId: number, subgroupId: number | null): Choice =>
    subgroupId === null ? `g:${groupId}` : `s:${subgroupId}`;

/** The group and subgroup a choice stands for (null when it no longer exists). */
function resolveChoice(
    groups: ClubGroup[],
    choice: Choice,
): { groupId: number; subgroupId: number | null } | null {
    const [kind, rawId] = choice.split(':');
    const id = Number(rawId);

    if (kind === 'g') {
        const group = groups.find((g) => g.id === id);

        if (!group) {
            return null;
        }

        // With a single subgroup there is no "All groups" overview: use it
        return {
            groupId: id,
            subgroupId:
                group.subgroups.length === 1 ? group.subgroups[0].id : null,
        };
    }

    if (kind === 's') {
        const group = groups.find((g) => g.subgroups.some((s) => s.id === id));

        return group ? { groupId: group.id, subgroupId: id } : null;
    }

    return null;
}

const sectionKey = (section: DaySection) =>
    `${section.group_id}-${section.subgroup_id ?? 'whole'}`;

const getInitials = (name: string) =>
    name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

/** One card of the day overview: a group and its subgroups' trainings. */
interface DayGroupCard {
    groupId: number | null;
    name: string;
    total: number;
    sections: DaySection[];
}

/** The day's sections (already in group order) as one card per group. */
function toGroupCards(sections: DaySection[]): DayGroupCard[] {
    const cards: DayGroupCard[] = [];

    for (const section of sections) {
        const last = cards[cards.length - 1];

        if (last && last.groupId === section.group_id) {
            last.sections.push(section);
            last.total += section.members.length;
        } else {
            cards.push({
                groupId: section.group_id,
                name: section.group_name ?? '—',
                total: section.members.length,
                sections: [section],
            });
        }
    }

    return cards;
}

/** A few faces of who came, then "+N" for the rest. */
function Faces({ members }: { members: MemberDetails[] }) {
    return (
        <AvatarGroup
            max={5}
            total={members.length}
            sx={{
                '& .MuiAvatar-root': {
                    width: 26,
                    height: 26,
                    fontSize: 11,
                    fontWeight: 700,
                    borderColor: POPUP_BG,
                },
            }}
        >
            {members.slice(0, 5).map((member, index) => (
                <Avatar key={member.id} sx={avatarSx(index)}>
                    {getInitials(member.name)}
                </Avatar>
            ))}
        </AvatarGroup>
    );
}

/** A heading inside the list to tick: who is already present, and the rest. */
function ListHeading({
    tone = 'muted',
    children,
}: {
    tone?: 'green' | 'muted';
    children: ReactNode;
}) {
    return (
        <li
            className={`border-b border-[var(--popup-border)] px-[18px] pt-3 pb-1.5 text-[11.5px] font-bold tracking-[1px] uppercase ${
                tone === 'green'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-[var(--popup-muted)]'
            }`}
        >
            {children}
        </li>
    );
}

/** How many came, as a small blue pill. */
function CountPill({ count }: { count: number }) {
    return (
        <span className="flex-none rounded-full bg-[rgba(27,143,214,0.16)] px-2 py-0.5 text-xs font-bold text-[#1b8fd6]">
            {count}
        </span>
    );
}

const CARD_SX = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1.5,
    textAlign: 'left',
    borderRadius: '12px',
} as const;

/** A calendar day, with a dot when attendance is recorded on it. */
function RecordedDay({
    recordedDays,
    ...props
}: PickersDayProps & { recordedDays?: Set<string> }) {
    const recorded =
        !props.outsideCurrentMonth &&
        recordedDays?.has(props.day.format('YYYY-MM-DD'));

    return (
        <PickersDay
            {...props}
            sx={
                recorded
                    ? {
                          '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 3,
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              bgcolor: '#22c55e',
                          },
                          '&.Mui-selected::after': { bgcolor: '#fff' },
                      }
                    : undefined
            }
        />
    );
}

// Old links (e.g. notifications) used ?pool=big|small
const LEGACY_POOL_NAMES: Record<string, string> = {
    big: 'big pool',
    small: 'small pool',
};

export default function TrainingsIndex({
    members,
    canManageGroups,
    canSeeAllGroups,
}: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    const groups = useGroups();
    // From the dashboard's "Add attendance" quick action
    const [openedToAdd] = useState(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('quick') === '1',
    );
    // Who sees every group starts on "All"; a coach of one group starts on it;
    // a coach of several groups first picks one
    const defaultChoice: Choice = canSeeAllGroups
        ? 'all'
        : groups.length === 1
          ? groupChoice(groups[0].id, null)
          : '';
    const [choice, setChoice] = useState<Choice>(defaultChoice);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [checkedIds, setCheckedIds] = useState<number[]>([]);
    // Who is recorded for the chosen day, as saved (Cancel goes back to this)
    const [savedIds, setSavedIds] = useState<number[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [attendanceSearch, setAttendanceSearch] = useState('');
    // "All groups" of a group with subgroups: a read-only overview of the day
    const [overview, setOverview] = useState<DaySection[] | null>(null);
    // The overview's group or subgroup whose members are shown (null: the cards)
    const [openSection, setOpenSection] = useState<DaySection | null>(null);
    const [detailsMember, setDetailsMember] = useState<MemberDetails | null>(
        null,
    );
    // Adding attendance on a group's overview: a subgroup must be picked first
    // Editing from the "All" overview: a group (or subgroup) is picked first
    const [showPickTarget, setShowPickTarget] = useState(false);
    // What is already entered on the chosen day, per group and time slot (null:
    // loading), for the tiles of "Which group?"
    const [daySections, setDaySections] = useState<DaySection[] | null>(null);
    // The day was opened from the calendar: Save and Cancel go back to it
    const [fromCalendar, setFromCalendar] = useState(false);
    // ...through "Which group?": closing goes back to that day's tiles
    const [fromTiles, setFromTiles] = useState(false);
    // The group (or subgroup) picked on an overview to edit. The chosen view
    // ("All", or a group) stays as it is, and so do the calendar's dots.
    const [editTarget, setEditTarget] = useState<{
        groupId: number;
        subgroupId: number | null;
    } | null>(null);
    // The overview that editing was started from (its group: none for "All"),
    // and the group or subgroup that was open there: Cancel and Save go back to it
    const [returnTo, setReturnTo] = useState<{
        overviewGroupId: number | null;
        overview: DaySection[];
        openSection: DaySection | null;
    } | null>(null);
    // The calendar's month, and its days with recorded attendance (the dots)
    const [viewMonth, setViewMonth] = useState(() => dayjs().format('YYYY-MM'));
    const [recordedDays, setRecordedDays] = useState<Set<string>>(
        () => new Set(),
    );
    // Bumped after a save, so the dots are fetched again
    const [daysVersion, setDaysVersion] = useState(0);

    // A deleted group or subgroup falls back to the default choice
    const showAll = choice === 'all' && canSeeAllGroups;
    // A club without groups: attendance is recorded for everyone, on "All groups"
    const noGroups = groups.length === 0 && canSeeAllGroups;
    const resolved = showAll
        ? null
        : (resolveChoice(groups, choice) ??
          resolveChoice(groups, defaultChoice));
    const activeGroupId = resolved?.groupId ?? null;
    const activeSubgroupId = resolved?.subgroupId ?? null;

    // The dots: every day with attendance, in all the groups this person sees
    useEffect(() => {
        const params = new URLSearchParams({ month: viewMonth });

        // No groups: only the days with attendance recorded for everyone, so a dot
        // always opens a day with names in it
        if (noGroups) {
            params.set('no_group', '1');
        }

        const request = new AbortController();
        fetch(`/trainings/days?${params}`, { signal: request.signal })
            .then((response) => (response.ok ? response.json() : { days: [] }))
            .then((data: { days: string[] }) =>
                setRecordedDays(new Set(data.days)),
            )
            .catch(() => {});

        return () => request.abort();
    }, [noGroups, viewMonth, daysVersion]);
    // A subgroup is optional for members, so every subgroup's training lists
    // all members of its main group
    // Members of all groups (no single group) train in every group
    // The group whose day is open: the one picked to edit, else the chosen one
    const dayGroupId = editTarget?.groupId ?? activeGroupId;
    const daySubgroupId = editTarget ? editTarget.subgroupId : activeSubgroupId;
    const groupMembers = noGroups
        ? members
        : members.filter(
              (m) => m.group_id === dayGroupId || m.group_id === null,
          );
    // Who came on the open day, as recorded (also members who have moved since)
    const [attended, setAttended] = useState<Member[]>([]);

    const loadAttendance = useCallback(
        async (
            date: Dayjs,
            group: number | null,
            subgroup: number | null,
            asOverview: boolean,
        ) => {
            setSelectedDate(date);
            setEditMode(false);
            setOpenSection(null);
            setLoading(true);
            setShowAttendanceModal(true);

            // No group: the overview of every group ("All")
            const day = `date=${date.format('YYYY-MM-DD')}${group === null ? '' : `&group_id=${group}`}`;

            // The overview's sections (an overview only)
            let sections: DaySection[] = [];

            // Fetch existing attendance for this date and group
            try {
                if (asOverview) {
                    const response = await fetch(
                        `/trainings/by-date?${day}&summary=1`,
                    );
                    const data = await response.json();
                    sections = data.sections ?? [];
                    setOverview(sections);
                } else {
                    const response = await fetch(
                        `/trainings/by-date?${day}${subgroup ? `&subgroup_id=${subgroup}` : ''}`,
                    );
                    const data = await response.json();
                    setOverview(null);
                    setAttended(data.attended ?? []);
                    setCheckedIds(data.member_ids ?? []);
                    setSavedIds(data.member_ids ?? []);
                }
            } catch {
                setOverview(asOverview ? [] : null);
                setAttended([]);
                setCheckedIds([]);
                setSavedIds([]);
            }

            setLoading(false);

            return sections;
        },
        [],
    );

    // Where attendance is entered: every group without time slots, and each slot
    const targets = groups.flatMap((group) =>
        group.subgroups.length === 0
            ? [{ groupId: group.id, subgroupId: null as number | null }]
            : group.subgroups.map((subgroup) => ({
                  groupId: group.id,
                  subgroupId: subgroup.id as number | null,
              })),
    );

    /**
     * A date first: then which group or time slot (its tile says what is already
     * entered), then the list to tick. With only one place to enter attendance
     * (or no groups at all) the list opens at once.
     */
    const handleDateClick = async (date: Dayjs | null) => {
        if (!date) {
            return;
        }

        setSelectedDate(date);
        setEditTarget(null);
        setReturnTo(null);

        if (noGroups) {
            setFromCalendar(true);
            await loadAttendance(date, null, null, false);
            setEditMode(true);

            return;
        }

        if (targets.length === 1) {
            await pickTargetAndEdit(
                targets[0].groupId,
                targets[0].subgroupId,
                date,
                false,
            );

            return;
        }

        setDaySections(null);
        setShowPickTarget(true);
        await loadDaySections(date);
    };

    // What each group and time slot already has on a day, for the tiles
    const loadDaySections = async (date: Dayjs) => {
        try {
            const response = await fetch(
                `/trainings/by-date?date=${date.format('YYYY-MM-DD')}&summary=1`,
            );
            const data = await response.json();
            setDaySections(data.sections ?? []);
        } catch {
            setDaySections([]);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const date = params.get('date');
        const groupParam = params.get('group');
        const legacyPool = LEGACY_POOL_NAMES[params.get('pool') ?? ''];
        const shouldOpenAttendance = params.get('attendance') === '1';

        const group = groupParam
            ? groups.find((g) => g.id === Number(groupParam))
            : groups.find((g) => g.name.toLowerCase() === legacyPool);

        if (!date || !shouldOpenAttendance) {
            return;
        }

        // A club without groups: everyone's attendance of that day
        if (!group) {
            if (noGroups) {
                queueMicrotask(async () => {
                    await loadAttendance(dayjs(date), null, null, false);

                    if (openedToAdd) {
                        setEditMode(true);
                    }
                });
            }

            return;
        }

        const subgroup =
            group.subgroups.find(
                (s) => s.id === Number(params.get('subgroup')),
            ) ?? null;

        queueMicrotask(async () => {
            setChoice(groupChoice(group.id, subgroup?.id ?? null));
            await loadAttendance(
                dayjs(date),
                group.id,
                subgroup?.id ?? null,
                group.subgroups.length > 0 && subgroup === null,
            );

            // "Add attendance" quick action: ready to tick who came
            if (openedToAdd) {
                setEditMode(true);
            }
        });
        // Only on the first visit: later group changes must not reopen it
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadAttendance]);

    const toggleMember = (id: number) => {
        if (!editMode) {
            return;
        }

        setCheckedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const handleSave = () => {
        if (!selectedDate || (dayGroupId === null && !noGroups)) {
            return;
        }

        const date = selectedDate;

        router.post(
            '/trainings',
            {
                date: selectedDate.format('YYYY-MM-DD'),
                group_id: dayGroupId,
                subgroup_id: daySubgroupId,
                member_ids: checkedIds,
            },
            {
                onSuccess: async () => {
                    if (openedToAdd) {
                        backToDashboard();

                        return;
                    }

                    setDaysVersion((version) => version + 1);
                    setAttendanceSearch('');

                    if (fromCalendar) {
                        showToast(
                            `${t('The attendance was saved')} · ${tc(':count present|:count present', checkedIds.length)}`,
                        );
                        closeAttendance();

                        return;
                    }

                    const saved = {
                        groupId: dayGroupId,
                        subgroupId: daySubgroupId,
                    };

                    // From an overview: back to it, with the saved group open
                    if (returnTo) {
                        const sections = await loadAttendance(
                            date,
                            returnTo.overviewGroupId,
                            null,
                            true,
                        );
                        setOpenSection(
                            sections.find(
                                (section) =>
                                    section.group_id === saved.groupId &&
                                    section.subgroup_id === saved.subgroupId,
                            ) ?? null,
                        );
                        setEditTarget(null);
                        setReturnTo(null);

                        return;
                    }

                    // One group (or everyone): its day, as now saved
                    await loadAttendance(
                        date,
                        saved.groupId,
                        saved.subgroupId,
                        false,
                    );
                },
            },
        );
    };

    // "5 present" or "Not entered" under a time slot's tile
    const slotStatus = (groupId: number, subgroupId: number | null) => {
        if (daySections === null) {
            return '…';
        }

        const count = recordedCount(groupId, subgroupId);

        return count > 0
            ? tc(':count present|:count present', count)
            : t('Not entered');
    };

    // How many came to a group's (or time slot's) training on the chosen day
    const recordedCount = (groupId: number, subgroupId: number | null) =>
        daySections?.find(
            (section) =>
                section.group_id === groupId &&
                section.subgroup_id === subgroupId,
        )?.members.length ?? 0;

    // A tile (or the only group): that group's day, ready to tick, with whoever
    // is already recorded ticked
    const pickTargetAndEdit = async (
        groupId: number,
        subgroupId: number | null,
        date: Dayjs | null = selectedDate,
        viaTiles = true,
    ) => {
        if (!date) {
            return;
        }

        setShowPickTarget(false);
        setFromCalendar(true);
        setFromTiles(viaTiles);
        setReturnTo(null);
        setEditTarget({ groupId, subgroupId });
        await loadAttendance(date, groupId, subgroupId, false);
        setEditMode(true);
    };

    // The section's group (and subgroup) still exists: its attendance can change.
    // A deleted group's past attendance can only be looked at.
    const sectionExists = (section: DaySection) =>
        section.group_id !== null &&
        groups.some(
            (g) =>
                g.id === section.group_id &&
                (section.subgroup_id === null ||
                    g.subgroups.some((sub) => sub.id === section.subgroup_id)),
        );
    const groupExists = (groupId: number | null) =>
        groupId !== null && groups.some((g) => g.id === groupId);

    /**
     * Edit (or add) attendance from an overview: inside an open group or subgroup,
     * that one at once; otherwise first pick which one.
     */
    const startEditing = () => {
        const open = openSection;

        if (open && open.group_id !== null && sectionExists(open)) {
            void pickTargetAndEdit(open.group_id, open.subgroup_id);
        } else {
            // One window for both: every group, or only the one chosen above
            setShowPickTarget(true);
        }
    };

    // Leave edit mode without saving: back to the calendar (or to the day as
    // recorded, when it was opened from a link)
    const cancelEdit = () => {
        if (fromCalendar) {
            closeAttendance();

            return;
        }

        setCheckedIds(savedIds);
        setEditMode(false);
        setAttendanceSearch('');

        if (returnTo) {
            setOverview(returnTo.overview);
            setOpenSection(returnTo.openSection);
            setEditTarget(null);
            setReturnTo(null);
        }
    };

    // Only the day was open (quick action): straight back to the dashboard
    const backToDashboard = () =>
        router.visit('/dashboard', { preserveScroll: true });

    const closeAttendance = () => {
        if (openedToAdd) {
            backToDashboard();

            return;
        }

        setShowAttendanceModal(false);

        // Opened from a tile: back to that day's tiles, with what is entered now
        if (fromTiles && selectedDate) {
            setShowPickTarget(true);
            void loadDaySections(selectedDate);
        }

        setFromTiles(false);
        setFromCalendar(false);
        setOpenSection(null);
        setOverview(null);
        setEditMode(false);
        setEditTarget(null);
        setReturnTo(null);
        setAttendanceSearch('');
    };

    const hasRecords = savedIds.length > 0;
    const overviewCount =
        overview?.reduce((sum, section) => sum + section.members.length, 0) ??
        0;
    const groupLabel = editTarget
        ? groupWithSubgroupName(
              groups,
              editTarget.groupId,
              editTarget.subgroupId,
          )
        : showAll
          ? t('All groups')
          : groupWithSubgroupName(groups, activeGroupId, activeSubgroupId);
    const sectionTitle = (section: DaySection) =>
        [section.group_name, section.name].filter(Boolean).join(' · ');
    // The day's list: the group's members today, plus anyone recorded that day who
    // has since moved to another group (their past attendance stays on the day)
    const inGroup = new Set(groupMembers.map((m) => m.id));
    const movedAway = (member: Member) => !inGroup.has(member.id);
    const dayMembers = [...groupMembers, ...attended.filter(movedAway)].sort(
        (a, b) => a.name.localeCompare(b.name),
    );
    // Ticking: whoever is already recorded comes first, under its own heading
    const presentFirst = editMode && savedIds.length > 0;
    const shownMembers = dayMembers
        .filter(
            (m) =>
                (editMode || checkedIds.includes(m.id)) &&
                m.name.toLowerCase().includes(attendanceSearch.toLowerCase()),
        )
        .sort((a, b) =>
            presentFirst
                ? Number(!savedIds.includes(a.id)) -
                  Number(!savedIds.includes(b.id))
                : 0,
        );
    const firstOther = shownMembers.findIndex(
        (member) => !savedIds.includes(member.id),
    );

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title={t('Trainings')} />

            {/* Main Attendance Modal */}
            <Dialog
                {...popup.dialogProps}
                // The "Add attendance" quick action shows only the day, not the calendar
                open={popup.dialogProps.open && !openedToAdd}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: POPUP_BG,
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                {/* Header */}
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<CalendarMonthIcon fontSize="small" />}
                        title={t('Trainings')}
                        subtitle={t('Choose a day')}
                        onClose={popup.close}
                    />
                    {groups.length === 0 && !noGroups && (
                        <p className="px-[18px] pb-3 text-sm text-[var(--popup-muted)]">
                            {canManageGroups ? (
                                <>
                                    {t('No groups yet.')}{' '}
                                    <Link
                                        href="/groups"
                                        className="font-semibold text-[#1690c8] hover:underline"
                                    >
                                        {t('Create them in Groups')}
                                    </Link>
                                </>
                            ) : (
                                t('No groups yet. Ask an admin to add one.')
                            )}
                        </p>
                    )}
                </DialogTitle>

                {/* Date Calendar */}
                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    {groups.length === 0 && !noGroups ? null : (
                        <LocalizationProvider
                            dateAdapter={AdapterDayjs}
                            adapterLocale={locale}
                            localeText={pickerLocaleText}
                        >
                            <DateCalendar
                                onChange={(date: Dayjs | null) =>
                                    handleDateClick(date)
                                }
                                onMonthChange={(month: Dayjs) =>
                                    setViewMonth(month.format('YYYY-MM'))
                                }
                                slots={{ day: RecordedDay }}
                                slotProps={{
                                    day: { recordedDays } as Partial<
                                        PickersDayProps & {
                                            recordedDays: Set<string>;
                                        }
                                    >,
                                }}
                                sx={{ width: '100%' }}
                            />
                        </LocalizationProvider>
                    )}
                </DialogContent>
            </Dialog>

            {/* Attendance for the chosen day */}
            <Dialog
                open={showAttendanceModal}
                onClose={closeAttendance}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: POPUP_BG,
                        height: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <PopupHeader
                        icon={<EventAvailableIcon fontSize="small" />}
                        title={selectedDate?.format('DD.MM.YYYY') ?? ''}
                        subtitle={
                            overview
                                ? `${showAll ? groupLabel : `${groupLabel} · ${t('all groups')}`} · ${tc(':count member attended|:count members attended', overviewCount)}`
                                : editMode
                                  ? `${groupLabel} · ${t('tick who came, then save')}`
                                  : `${groupLabel} · ${tc(':count member attended|:count members attended', savedIds.length)}`
                        }
                        onClose={closeAttendance}
                    />
                    {!overview && (editMode || hasRecords) && (
                        <div className="pb-3">
                            <PillSearchField
                                value={attendanceSearch}
                                onChange={setAttendanceSearch}
                                placeholder={t('Search members...')}
                            />
                        </div>
                    )}
                </DialogTitle>

                <DialogContent sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <ListSkeleton rows={5} />
                    ) : overview ? (
                        overview.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                                <IconBadge>
                                    <EventAvailableIcon fontSize="small" />
                                </IconBadge>
                                <div className="flex flex-col gap-1">
                                    <p className="text-base font-bold text-[var(--popup-fg)]">
                                        {t('No recorded members for this date')}
                                    </p>
                                    <p className="text-sm text-[var(--popup-muted)]">
                                        {t(
                                            'Add the members who came to this training.',
                                        )}
                                    </p>
                                </div>
                                {/* First which group (or subgroup), then tick who came */}
                                <Button
                                    variant="contained"
                                    startIcon={<PersonAddAlt1Icon />}
                                    onClick={startEditing}
                                >
                                    {t('Add members')}
                                </Button>
                            </div>
                        ) : (
                            // Read-only: one card per group (its subgroups as rows inside),
                            // with a few faces; a card or row opens who came
                            <div className="flex flex-col gap-3 px-4 py-3">
                                {openSection ? (
                                    // Back to the cards
                                    <ButtonBase
                                        onClick={() => setOpenSection(null)}
                                        sx={{
                                            ...CARD_SX,
                                            justifyContent: 'flex-start',
                                            px: 1,
                                            py: 1,
                                            '&:hover': {
                                                bgcolor: popupFg(0.05),
                                            },
                                        }}
                                    >
                                        <ArrowBackIcon
                                            sx={{
                                                color: POPUP_FG,
                                                fontSize: 20,
                                            }}
                                        />
                                        <span className="min-w-0 truncate text-base font-extrabold text-[var(--popup-fg)]">
                                            {sectionTitle(openSection)}
                                            {openSection.group_id !== null &&
                                                !sectionExists(openSection) && (
                                                    <span className="font-normal text-[var(--popup-muted)]">
                                                        {' '}
                                                        ({t('deleted')})
                                                    </span>
                                                )}
                                        </span>
                                        <CountPill
                                            count={openSection.members.length}
                                        />
                                    </ButtonBase>
                                ) : (
                                    <p className="flex items-center gap-1.5 px-1 text-[12.5px] text-[var(--popup-muted)]">
                                        <TouchAppIcon sx={{ fontSize: 16 }} />
                                        {showAll
                                            ? t(
                                                  'Tap a group to see who attended',
                                              )
                                            : t(
                                                  'Tap a subgroup to see who attended',
                                              )}
                                    </p>
                                )}

                                {openSection ? (
                                    // Who came: tapping one opens the member's details
                                    <List disablePadding sx={{ mx: -2 }}>
                                        {openSection.members.map(
                                            (member, index) => (
                                                <ListItemButton
                                                    key={member.id}
                                                    divider
                                                    onClick={() =>
                                                        setDetailsMember(member)
                                                    }
                                                    sx={{ px: 2.25 }}
                                                >
                                                    <ListItemAvatar>
                                                        <Avatar
                                                            sx={avatarSx(index)}
                                                        >
                                                            {getInitials(
                                                                member.name,
                                                            )}
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={
                                                            <Typography
                                                                variant="body1"
                                                                fontWeight="bold"
                                                            >
                                                                {member.name}
                                                            </Typography>
                                                        }
                                                    />
                                                    <ChevronRightIcon
                                                        sx={{
                                                            color: 'var(--popup-muted)',
                                                        }}
                                                    />
                                                </ListItemButton>
                                            ),
                                        )}
                                    </List>
                                ) : (
                                    toGroupCards(overview).map((card) => {
                                        const whole =
                                            card.sections.length === 1 &&
                                            card.sections[0].subgroup_id ===
                                                null;

                                        // A group trained as a whole: the card itself opens it
                                        return whole ? (
                                            <div
                                                key={card.groupId ?? 'all'}
                                                className="relative"
                                            >
                                                <ButtonBase
                                                    onClick={() =>
                                                        setOpenSection(
                                                            card.sections[0],
                                                        )
                                                    }
                                                    sx={{
                                                        ...CARD_SX,
                                                        flexDirection: 'column',
                                                        alignItems: 'stretch',
                                                        p: 1.5,
                                                        bgcolor: popupFg(0.04),
                                                        border: `1px solid ${popupFg(0.12)}`,
                                                        '&:hover': {
                                                            bgcolor:
                                                                popupFg(0.08),
                                                        },
                                                    }}
                                                >
                                                    <span className="flex items-center justify-between gap-2">
                                                        <span className="min-w-0 truncate text-base font-extrabold text-[var(--popup-fg)]">
                                                            {card.name}
                                                            {card.groupId !==
                                                                null &&
                                                                !groupExists(
                                                                    card.groupId,
                                                                ) && (
                                                                    <span className="font-normal text-[var(--popup-muted)]">
                                                                        {' '}
                                                                        (
                                                                        {t(
                                                                            'deleted',
                                                                        )}
                                                                        )
                                                                    </span>
                                                                )}
                                                        </span>
                                                        <CountPill
                                                            count={card.total}
                                                        />
                                                    </span>
                                                    <span className="mt-2 flex items-center justify-between">
                                                        <Faces
                                                            members={
                                                                card.sections[0]
                                                                    .members
                                                            }
                                                        />
                                                        <ChevronRightIcon
                                                            sx={{
                                                                color: 'var(--popup-muted)',
                                                            }}
                                                        />
                                                    </span>
                                                </ButtonBase>
                                            </div>
                                        ) : (
                                            // A group with subgroups: one row per subgroup
                                            <div
                                                key={card.groupId}
                                                className="rounded-xl p-3"
                                                style={{
                                                    background: popupFg(0.04),
                                                    border: `1px solid ${popupFg(0.12)}`,
                                                }}
                                            >
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <span className="min-w-0 truncate text-base font-extrabold text-[var(--popup-fg)]">
                                                        {card.name}
                                                        {card.groupId !==
                                                            null &&
                                                            !groupExists(
                                                                card.groupId,
                                                            ) && (
                                                                <span className="font-normal text-[var(--popup-muted)]">
                                                                    {' '}
                                                                    (
                                                                    {t(
                                                                        'deleted',
                                                                    )}
                                                                    )
                                                                </span>
                                                            )}
                                                    </span>
                                                    <CountPill
                                                        count={card.total}
                                                    />
                                                </div>
                                                {card.sections.map(
                                                    (section) => (
                                                        <div
                                                            key={sectionKey(
                                                                section,
                                                            )}
                                                            className="mt-2 flex items-center gap-1.5"
                                                        >
                                                            <ButtonBase
                                                                onClick={() =>
                                                                    setOpenSection(
                                                                        section,
                                                                    )
                                                                }
                                                                sx={{
                                                                    ...CARD_SX,
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                    px: 1.25,
                                                                    py: 1,
                                                                    borderRadius:
                                                                        '8px',
                                                                    bgcolor:
                                                                        POPUP_BG,
                                                                    '&:hover': {
                                                                        bgcolor:
                                                                            popupFg(
                                                                                0.06,
                                                                            ),
                                                                    },
                                                                }}
                                                            >
                                                                <span className="min-w-0 truncate text-sm font-bold text-[var(--popup-fg)]">
                                                                    {section.name ??
                                                                        t(
                                                                            'Whole group',
                                                                        )}
                                                                    <span className="font-normal text-[var(--popup-muted)]">
                                                                        {' · '}
                                                                        {
                                                                            section
                                                                                .members
                                                                                .length
                                                                        }
                                                                    </span>
                                                                </span>
                                                                <span className="flex flex-none items-center gap-1">
                                                                    <Faces
                                                                        members={
                                                                            section.members
                                                                        }
                                                                    />
                                                                    <ChevronRightIcon
                                                                        sx={{
                                                                            color: 'var(--popup-muted)',
                                                                        }}
                                                                    />
                                                                </span>
                                                            </ButtonBase>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )
                    ) : !editMode && !hasRecords ? (
                        // Nothing recorded yet for this day: say so and offer to add members
                        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                            <IconBadge>
                                <EventAvailableIcon fontSize="small" />
                            </IconBadge>
                            <div className="flex flex-col gap-1">
                                <p className="text-base font-bold text-[var(--popup-fg)]">
                                    {t('No recorded members for this date')}
                                </p>
                                <p className="text-sm text-[var(--popup-muted)]">
                                    {t(
                                        'Add the members who came to this training.',
                                    )}
                                </p>
                            </div>
                            <Button
                                variant="contained"
                                startIcon={<PersonAddAlt1Icon />}
                                onClick={() => setEditMode(true)}
                                disabled={groupMembers.length === 0}
                            >
                                {t('Add members')}
                            </Button>
                            {groupMembers.length === 0 && (
                                <p className="text-sm text-[var(--popup-muted)]">
                                    {t(
                                        'There are no active members in this group yet.',
                                    )}
                                </p>
                            )}
                        </div>
                    ) : shownMembers.length === 0 ? (
                        <p className="mt-10 text-center text-sm text-[var(--popup-muted)]">
                            {t('No members match your search.')}
                        </p>
                    ) : (
                        <List disablePadding>
                            {shownMembers.map((member, index) => (
                                <Fragment key={member.id}>
                                    {presentFirst && index === 0 && (
                                        <ListHeading tone="green">
                                            {t('Already present (:count)', {
                                                count: savedIds.length,
                                            })}
                                        </ListHeading>
                                    )}
                                    {presentFirst && index === firstOther && (
                                        <ListHeading>
                                            {t('Other members')}
                                        </ListHeading>
                                    )}
                                    <ListItem
                                        divider
                                        onClick={() => toggleMember(member.id)}
                                        sx={{
                                            px: 2.25,
                                            cursor: editMode
                                                ? 'pointer'
                                                : 'default',
                                        }}
                                        secondaryAction={
                                            editMode ? (
                                                <Checkbox
                                                    edge="end"
                                                    checked={checkedIds.includes(
                                                        member.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleMember(member.id)
                                                    }
                                                    // The row toggles too: keep one click from toggling twice
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    inputProps={{
                                                        'aria-label': t(
                                                            ':name attended',
                                                            {
                                                                name: member.name,
                                                            },
                                                        ),
                                                    }}
                                                />
                                            ) : undefined
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={avatarSx(index)}>
                                                {getInitials(member.name)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    variant="body1"
                                                    fontWeight="bold"
                                                >
                                                    {member.name}
                                                </Typography>
                                            }
                                            secondary={
                                                // Came that day, but trains in another group now
                                                movedAway(member)
                                                    ? t('Now in :group', {
                                                          group: groupWithSubgroupName(
                                                              groups,
                                                              member.group_id,
                                                              member.subgroup_id,
                                                          ),
                                                      })
                                                    : undefined
                                            }
                                        />
                                    </ListItem>
                                </Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>

                {/* Footer: on an overview with records, one big edit button (an empty
                    day has its "Add members" button in the middle instead) */}
                {overview ? (
                    overview.length > 0 &&
                    (openSection &&
                    openSection.group_id !== null &&
                    !sectionExists(openSection) ? (
                        <p className="flex-shrink-0 px-6 pt-2 pb-5 text-center text-sm text-[var(--popup-muted)]">
                            {t(
                                'This group was deleted: its attendance can only be viewed.',
                            )}
                        </p>
                    ) : (
                        <div className="flex-shrink-0 p-4">
                            <Button
                                variant="outlined"
                                fullWidth
                                size="large"
                                startIcon={<EditIcon />}
                                onClick={startEditing}
                            >
                                {t('Edit attendance')}
                            </Button>
                        </div>
                    ))
                ) : editMode ? (
                    <div className="flex flex-shrink-0 gap-3 p-4">
                        <Button
                            variant="outlined"
                            onClick={cancelEdit}
                            sx={{ px: 3 }}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleSave}
                            // A day that had attendance may be saved with nobody ticked (clears it)
                            disabled={checkedIds.length === 0 && !hasRecords}
                            sx={{ py: 0.5, lineHeight: 1.2 }}
                        >
                            {/* Two short lines: the action, and how many are ticked */}
                            <span className="flex flex-col items-center">
                                <span>{t('Save Attendance')}</span>
                                <span className="text-xs font-semibold opacity-85">
                                    {t('(:count present)', {
                                        count: checkedIds.length,
                                    })}
                                </span>
                            </span>
                        </Button>
                    </div>
                ) : (
                    hasRecords && (
                        <div className="flex-shrink-0 p-4">
                            <Button
                                variant="outlined"
                                fullWidth
                                size="large"
                                startIcon={<EditIcon />}
                                onClick={() => setEditMode(true)}
                            >
                                {t('Edit attendance')}
                            </Button>
                        </div>
                    )
                )}
            </Dialog>

            {/* Which group's (or time slot's) attendance: one window, tiles */}
            <Dialog
                open={showPickTarget}
                onClose={() => setShowPickTarget(false)}
                disableRestoreFocus
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <PopupHeader
                    icon={<CalendarMonthIcon fontSize="small" />}
                    title={t('Which group?')}
                    subtitle={`${selectedDate?.format('DD.MM.YYYY') ?? ''} · ${t('enter attendance')}`}
                    onClose={() => setShowPickTarget(false)}
                />
                <Note tone="info" className="mx-[18px] mb-3">
                    {t('Attendance is entered separately for each time slot.')}
                </Note>
                <div className="max-h-[60vh] overflow-y-auto pb-3">
                    {groups.map((group) => (
                        <section
                            key={group.id}
                            className="border-t border-[var(--popup-border)] px-[18px] pt-3 pb-3.5"
                        >
                            <div className="mb-2.5">
                                <SectionLabel>{group.name}</SectionLabel>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {group.subgroups.length === 0 ? (
                                    <Tile
                                        wide
                                        name={t('Whole group')}
                                        status={slotStatus(group.id, null)}
                                        statusTone={
                                            recordedCount(group.id, null) > 0
                                                ? 'green'
                                                : 'muted'
                                        }
                                        onClick={() =>
                                            void pickTargetAndEdit(
                                                group.id,
                                                null,
                                            )
                                        }
                                    />
                                ) : (
                                    group.subgroups.map((subgroup) => (
                                        <Tile
                                            key={subgroup.id}
                                            label={t('Time slot')}
                                            name={subgroup.name}
                                            status={slotStatus(
                                                group.id,
                                                subgroup.id,
                                            )}
                                            statusTone={
                                                recordedCount(
                                                    group.id,
                                                    subgroup.id,
                                                ) > 0
                                                    ? 'green'
                                                    : 'muted'
                                            }
                                            onClick={() =>
                                                void pickTargetAndEdit(
                                                    group.id,
                                                    subgroup.id,
                                                )
                                            }
                                        />
                                    ))
                                )}
                            </div>
                        </section>
                    ))}
                </div>
            </Dialog>

            <MemberDetailsDialog
                member={detailsMember}
                onClose={() => setDetailsMember(null)}
            />
        </MuiThemeProvider>
    );
}
