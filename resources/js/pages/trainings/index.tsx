import { Head, Link, router } from '@inertiajs/react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
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
    PillSearchField,
    PopupHeader,
} from '@/components/popup-ui';
import { ListSkeleton } from '@/components/skeletons';
import { usePagePopup } from '@/hooks/use-page-popup';
import { groupWithSubgroupName, subgroupsOf, useGroups } from '@/lib/groups';
import type { ClubGroup } from '@/lib/groups';
import { locale, pickerLocaleText, t, tc } from '@/lib/i18n';

interface Member {
    id: number;
    name: string;
    group_id: number | null;
    subgroup_id: number | null;
}

/** Who came to one subgroup's (or the whole group's) training on a day. */
interface DaySection {
    group_id: number;
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

/** The subgroup buttons: one joined bar, the picked one filled. */
const SEGMENT_SX = {
    '& .MuiToggleButton-root': {
        color: POPUP_FG,
        borderColor: popupFg(0.3),
        textTransform: 'none',
        fontWeight: 600,
        py: 0.75,
    },
    '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover':
        { bgcolor: '#1b8fd6', color: '#fff' },
} as const;

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
    // Which of the overview's groups are opened (all closed when a day opens)
    const [openSections, setOpenSections] = useState<string[]>([]);
    const toggleSection = (key: string) =>
        setOpenSections((open) =>
            open.includes(key) ? open.filter((k) => k !== key) : [...open, key],
        );
    const [detailsMember, setDetailsMember] = useState<MemberDetails | null>(
        null,
    );
    // Adding attendance on a group's overview: a subgroup must be picked first
    const [showPickSubgroup, setShowPickSubgroup] = useState(false);

    // A deleted group or subgroup falls back to the default choice
    const showAll = choice === 'all' && canSeeAllGroups;
    const resolved = showAll
        ? null
        : (resolveChoice(groups, choice) ??
          resolveChoice(groups, defaultChoice));
    const activeChoice: Choice = showAll
        ? 'all'
        : resolved
          ? groupChoice(resolved.groupId, resolved.subgroupId)
          : '';
    const activeGroupId = resolved?.groupId ?? null;
    const activeSubgroupId = resolved?.subgroupId ?? null;
    const subgroups = subgroupsOf(groups, activeGroupId);
    // A subgroup is optional for members, so every subgroup's training lists
    // all members of its main group
    const groupMembers = members.filter((m) => m.group_id === activeGroupId);
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
            setOpenSections([]);
            setLoading(true);

            // No group: the overview of every group ("All")
            const day = `date=${date.format('YYYY-MM-DD')}${group === null ? '' : `&group_id=${group}`}`;

            // Fetch existing attendance for this date and group
            try {
                if (asOverview) {
                    const response = await fetch(
                        `/trainings/by-date?${day}&summary=1`,
                    );
                    const data = await response.json();
                    setOverview(data.sections ?? []);
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
            setShowAttendanceModal(true);
        },
        [],
    );

    const handleDateClick = async (date: Dayjs | null) => {
        if (!date) {
            return;
        }

        if (showAll) {
            await loadAttendance(date, null, null, true);

            return;
        }

        if (activeGroupId === null) {
            return;
        }

        await loadAttendance(
            date,
            activeGroupId,
            activeSubgroupId,
            subgroups.length > 0 && activeSubgroupId === null,
        );
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

        if (!date || !group || !shouldOpenAttendance) {
            return;
        }

        const subgroup =
            group.subgroups.find(
                (s) => s.id === Number(params.get('subgroup')),
            ) ?? null;

        queueMicrotask(() => {
            setChoice(groupChoice(group.id, subgroup?.id ?? null));
            void loadAttendance(
                dayjs(date),
                group.id,
                subgroup?.id ?? null,
                group.subgroups.length > 0 && subgroup === null,
            );
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
        if (!selectedDate || activeGroupId === null) {
            return;
        }

        router.post(
            '/trainings',
            {
                date: selectedDate.format('YYYY-MM-DD'),
                group_id: activeGroupId,
                subgroup_id: activeSubgroupId,
                member_ids: checkedIds,
            },
            {
                onSuccess: () => {
                    setShowAttendanceModal(false);
                    setCheckedIds([]);
                    setSavedIds([]);
                    setEditMode(false);
                    setAttendanceSearch('');
                },
            },
        );
    };

    // From the "pick a subgroup" warning: open that subgroup's day, ready to tick
    const pickSubgroupAndAdd = async (subgroupId: number) => {
        if (!selectedDate || activeGroupId === null) {
            return;
        }

        setShowPickSubgroup(false);
        setChoice(groupChoice(activeGroupId, subgroupId));
        await loadAttendance(selectedDate, activeGroupId, subgroupId, false);
        setEditMode(true);
    };

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    // Leave edit mode without saving: back to what is recorded for the day
    const cancelEdit = () => {
        setCheckedIds(savedIds);
        setEditMode(false);
        setAttendanceSearch('');
    };

    const closeAttendance = () => {
        setShowAttendanceModal(false);
        setOverview(null);
        setEditMode(false);
        setAttendanceSearch('');
    };

    const hasRecords = savedIds.length > 0;
    const overviewCount =
        overview?.reduce((sum, section) => sum + section.members.length, 0) ??
        0;
    const groupLabel = showAll
        ? t('All groups')
        : groupWithSubgroupName(groups, activeGroupId, activeSubgroupId);
    const sectionTitle = (section: DaySection) =>
        showAll
            ? [section.group_name ?? '—', section.name]
                  .filter(Boolean)
                  .join(' · ')
            : (section.name ?? t('All groups'));
    // The day's list: the group's members today, plus anyone recorded that day who
    // has since moved to another group (their past attendance stays on the day)
    const inGroup = new Set(groupMembers.map((m) => m.id));
    const movedAway = (member: Member) => !inGroup.has(member.id);
    const dayMembers = [...groupMembers, ...attended.filter(movedAway)].sort(
        (a, b) => a.name.localeCompare(b.name),
    );
    const shownMembers = dayMembers.filter(
        (m) =>
            (editMode || checkedIds.includes(m.id)) &&
            m.name.toLowerCase().includes(attendanceSearch.toLowerCase()),
    );

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title={t('Trainings')} />

            {/* Main Attendance Modal */}
            <Dialog
                {...popup.dialogProps}
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
                        subtitle={t(
                            'Pick a group and a day to see who trained',
                        )}
                        onClose={popup.close}
                    />
                    {groups.length > 0 ? (
                        <div className="px-[18px] pb-3">
                            <FormControl fullWidth size="small">
                                <InputLabel
                                    id="training-group-label"
                                    shrink
                                    sx={{ color: popupFg(0.5) }}
                                >
                                    {t('Group')}
                                </InputLabel>
                                <Select
                                    labelId="training-group-label"
                                    label={t('Group')}
                                    notched
                                    displayEmpty
                                    value={
                                        showAll
                                            ? 'all'
                                            : activeGroupId === null
                                              ? ''
                                              : groupChoice(activeGroupId, null)
                                    }
                                    onChange={(e) =>
                                        setChoice(String(e.target.value))
                                    }
                                    renderValue={(value) =>
                                        value === ''
                                            ? t('Choose a group')
                                            : value === 'all'
                                              ? t('All')
                                              : (groups.find(
                                                    (g) =>
                                                        g.id === activeGroupId,
                                                )?.name ?? '')
                                    }
                                    sx={{
                                        color:
                                            activeChoice === ''
                                                ? popupFg(0.5)
                                                : POPUP_FG,
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: popupFg(0.3),
                                        },
                                        '& .MuiSvgIcon-root': {
                                            color: POPUP_FG,
                                        },
                                    }}
                                >
                                    {canSeeAllGroups && (
                                        <MenuItem value="all">
                                            {t('All')}
                                        </MenuItem>
                                    )}
                                    {groups.map((group) => (
                                        <MenuItem
                                            key={group.id}
                                            value={groupChoice(group.id, null)}
                                        >
                                            {group.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {/* Subgroups: pick one to record its attendance. None picked
                                (tap the picked one again): the whole group, read-only */}
                            {activeGroupId !== null && subgroups.length > 0 && (
                                <ToggleButtonGroup
                                    exclusive
                                    fullWidth
                                    size="small"
                                    value={activeChoice}
                                    onChange={(_, value: Choice | null) =>
                                        setChoice(
                                            value ??
                                                groupChoice(
                                                    activeGroupId,
                                                    null,
                                                ),
                                        )
                                    }
                                    sx={{ mt: 1.5, ...SEGMENT_SX }}
                                >
                                    {subgroups.map((subgroup) => (
                                        <ToggleButton
                                            key={subgroup.id}
                                            value={groupChoice(
                                                activeGroupId,
                                                subgroup.id,
                                            )}
                                        >
                                            {subgroup.name}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            )}
                        </div>
                    ) : (
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
                    {activeChoice === '' ? (
                        groups.length > 0 && (
                            <p className="px-6 py-12 text-center text-sm text-[var(--popup-muted)]">
                                {t(
                                    'Choose a group above to see its trainings and add attendance.',
                                )}
                            </p>
                        )
                    ) : (
                        <LocalizationProvider
                            dateAdapter={AdapterDayjs}
                            adapterLocale={locale}
                            localeText={pickerLocaleText}
                        >
                            <DateCalendar
                                onChange={(date: Dayjs | null) =>
                                    handleDateClick(date)
                                }
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
                        height: '70vh',
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
                                    {/* "All" is read-only: nothing to add from here */}
                                    {!showAll && (
                                        <p className="text-sm text-[var(--popup-muted)]">
                                            {t(
                                                'Add the members who came to this training.',
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Read-only: who came, per subgroup. Rows like the Members
                            // list; tapping one opens the member's details
                            <div className="flex flex-col gap-1 py-3">
                                <p className="flex items-center gap-1.5 px-[18px] text-[12.5px] text-[var(--popup-muted)]">
                                    <TouchAppIcon sx={{ fontSize: 16 }} />
                                    {/* Folded groups/subgroups open first; a single one lists its members */}
                                    {overview.length === 1
                                        ? t('Tap a member to see their details')
                                        : showAll
                                          ? t('Tap a group to see who attended')
                                          : t(
                                                'Tap a subgroup to see who attended',
                                            )}
                                </p>
                                {overview.map((section, _, all) => {
                                    const key = sectionKey(section);
                                    // Only a day with more than one group (or subgroup)
                                    // folds them away; a single one is just listed
                                    const foldable = all.length > 1;
                                    const open =
                                        !foldable || openSections.includes(key);

                                    return (
                                        <section key={key}>
                                            {/* Group, how many came, arrow: tap to show who */}
                                            <ButtonBase
                                                disabled={!foldable}
                                                onClick={() =>
                                                    toggleSection(key)
                                                }
                                                aria-expanded={
                                                    foldable ? open : undefined
                                                }
                                                sx={{
                                                    width: '100%',
                                                    justifyContent:
                                                        'flex-start',
                                                    gap: 1,
                                                    px: 2.25,
                                                    py: 1.25,
                                                    textAlign: 'left',
                                                    '&:hover': {
                                                        bgcolor: popupFg(0.05),
                                                    },
                                                }}
                                            >
                                                <span className="min-w-0 truncate text-base font-extrabold text-[var(--popup-fg)]">
                                                    {sectionTitle(section)}
                                                </span>
                                                <span className="flex-none text-sm text-[var(--popup-muted)]">
                                                    {section.members.length}
                                                </span>
                                                {foldable && (
                                                    <ExpandMoreIcon
                                                        sx={{
                                                            flex: 'none',
                                                            color: POPUP_FG,
                                                            transition:
                                                                'transform 200ms',
                                                            transform: open
                                                                ? 'rotate(180deg)'
                                                                : 'none',
                                                        }}
                                                    />
                                                )}
                                            </ButtonBase>
                                            <Collapse in={open} unmountOnExit>
                                                <List disablePadding>
                                                    {section.members.map(
                                                        (member, index) => (
                                                            <ListItemButton
                                                                key={member.id}
                                                                divider
                                                                onClick={() =>
                                                                    setDetailsMember(
                                                                        member,
                                                                    )
                                                                }
                                                                sx={{
                                                                    px: 2.25,
                                                                }}
                                                            >
                                                                <ListItemAvatar>
                                                                    <Avatar
                                                                        sx={avatarSx(
                                                                            index,
                                                                        )}
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
                                                                            {
                                                                                member.name
                                                                            }
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
                                            </Collapse>
                                        </section>
                                    );
                                })}
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
                                <ListItem
                                    key={member.id}
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
                                                        { name: member.name },
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
                            ))}
                        </List>
                    )}
                </DialogContent>

                {/* Footer: "All" is read-only; a group's overview asks for a subgroup to add */}
                {overview && showAll ? null : overview ? (
                    <div className="flex-shrink-0 p-4">
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<PersonAddAlt1Icon />}
                            onClick={() => setShowPickSubgroup(true)}
                        >
                            {t('Add members')}
                        </Button>
                    </div>
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

            {/* Attendance is recorded per subgroup */}
            <Dialog
                open={showPickSubgroup}
                onClose={() => setShowPickSubgroup(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <IconBadge>
                        <WarningAmberIcon fontSize="small" />
                    </IconBadge>
                    <p className="text-base font-bold text-[var(--popup-fg)]">
                        {t(
                            'Please select a subgroup so you can enter attendance.',
                        )}
                    </p>
                    {/* Pick it right here and go on adding that subgroup's attendance */}
                    <ToggleButtonGroup
                        exclusive
                        fullWidth
                        size="small"
                        value={null}
                        onChange={(_, value: number | null) => {
                            if (value !== null) {
                                void pickSubgroupAndAdd(value);
                            }
                        }}
                        sx={SEGMENT_SX}
                    >
                        {subgroups.map((subgroup) => (
                            <ToggleButton key={subgroup.id} value={subgroup.id}>
                                {subgroup.name}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setShowPickSubgroup(false)}
                    >
                        {t('Cancel')}
                    </Button>
                </div>
            </Dialog>

            <MemberDetailsDialog
                member={detailsMember}
                onClose={() => setDetailsMember(null)}
            />
        </MuiThemeProvider>
    );
}
