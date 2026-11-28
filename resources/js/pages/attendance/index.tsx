import { Head } from '@inertiajs/react';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import {
    MuiThemeProvider,
    POPUP_BG,
    POPUP_FG,
    popupFg,
} from '@/components/mui-theme-provider';
import {
    avatarSx,
    DrillRow,
    EmptyState,
    PillSearchField,
    PopupHeader,
    SummaryCard,
    YearSection,
} from '@/components/popup-ui';
import { CardsSkeleton } from '@/components/skeletons';
import { usePagePopup } from '@/hooks/use-page-popup';
import { groupNameOf, groupWithSubgroupName, useGroups } from '@/lib/groups';
import { t, tc } from '@/lib/i18n';

interface Member {
    id: number;
    name: string;
    group_id: number | null;
    current_month_attendances_count: number;
}

/** A training day a member came to. */
interface AttendanceRow {
    id: number;
    date: string;
    group_id: number | null;
    subgroup_id: number | null;
}

interface Props {
    userRole: 'admin' | 'coach';
    members: Member[];
}

export default function AttendanceIndex({ members }: Props) {
    // Fades in and out over the dashboard
    const popup = usePagePopup();
    const groups = useGroups();
    // 'all' or one group's id. The groups are only the ones this user may see, so
    // "All" means every group for admins and all of a coach's own groups. A coach
    // with a single group just sees that group (no "All").
    const showAll = groups.length !== 1;
    const [groupFilter, setGroupFilter] = useState<'all' | number>('all');
    const activeFilter: 'all' | number =
        groupFilter !== 'all' && groups.some((g) => g.id === groupFilter)
            ? groupFilter
            : showAll
              ? 'all'
              : groups[0].id;
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [showMemberHistoryModal, setShowMemberHistoryModal] = useState(false);
    const [showMonthDatesModal, setShowMonthDatesModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [attendanceSearch, setAttendanceSearch] = useState('');

    const counts = members.reduce<Record<number, number>>((all, member) => {
        if (member.group_id !== null) {
            all[member.group_id] = (all[member.group_id] ?? 0) + 1;
        }

        return all;
    }, {});

    const filteredMembers = members.filter(
        (member) =>
            (activeFilter === 'all' ||
                member.group_id === activeFilter ||
                member.group_id === null) &&
            member.name.toLowerCase().includes(attendanceSearch.toLowerCase()),
    );

    // The opened member's training days (null while they load)
    const [history, setHistory] = useState<AttendanceRow[] | null>(null);
    const historyFor = useRef<number | null>(null);

    const openHistory = async (member: Member) => {
        setSelectedMember(member);
        setHistory(null);
        setShowMemberHistoryModal(true);
        historyFor.current = member.id;

        try {
            const response = await fetch(`/attendance/by-member/${member.id}`, {
                headers: { Accept: 'application/json' },
            });
            const data = await response.json();

            // Ignore an answer for a member who is no longer open
            if (historyFor.current === member.id) {
                setHistory(data.attendances ?? []);
            }
        } catch {
            if (historyFor.current === member.id) {
                setHistory([]);
            }
        }
    };

    const memberAttendanceRows = useMemo(
        () =>
            [...(history ?? [])].sort(
                (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
            ),
        [history],
    );

    const selectedMonthAttendances = selectedMonth
        ? memberAttendanceRows
              .filter(
                  (row) =>
                      dayjs(row.date).startOf('month').format('YYYY-MM-DD') ===
                      selectedMonth,
              )
              .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
        : [];

    const groupedByMonth = useMemo(() => {
        const grouped: Record<string, { month: string; total: number }> = {};

        memberAttendanceRows.forEach((row) => {
            const monthKey = dayjs(row.date)
                .startOf('month')
                .format('YYYY-MM-DD');

            if (!grouped[monthKey]) {
                grouped[monthKey] = {
                    month: monthKey,
                    total: 0,
                };
            }

            grouped[monthKey].total += 1;
        });

        return grouped;
    }, [memberAttendanceRows]);

    const sortedMonths = Object.keys(groupedByMonth).sort().reverse();
    const currentYear = dayjs().format('YYYY');
    const currentMonthKey = dayjs().startOf('month').format('YYYY-MM-DD');
    const currentMonthData = groupedByMonth[currentMonthKey] ?? null;

    const yearGroups: Record<
        string,
        { year: string; total: number; monthCount: number }
    > = {};

    Object.values(groupedByMonth).forEach((monthData) => {
        const year = dayjs(monthData.month).format('YYYY');

        if (!yearGroups[year]) {
            yearGroups[year] = {
                year,
                total: 0,
                monthCount: 0,
            };
        }

        yearGroups[year].total += monthData.total;
        yearGroups[year].monthCount += 1;
    });

    // Newest year first; only the newest starts open
    const allYears = Object.keys(yearGroups).sort().reverse();

    // The last training of a month (its rows are newest first)
    const lastDateOf = (month: string) =>
        memberAttendanceRows.find(
            (row) =>
                dayjs(row.date).startOf('month').format('YYYY-MM-DD') === month,
        )?.date;

    const closeHistory = () => {
        setShowMemberHistoryModal(false);
        setSelectedMember(null);
    };

    const closeMonth = () => {
        setShowMonthDatesModal(false);
        setSelectedMonth(null);
    };

    // From a member's card: their attendance right away
    useEffect(() => {
        const memberId = Number(
            new URLSearchParams(window.location.search).get('member'),
        );
        const member = members.find((item) => item.id === memberId);

        if (member) {
            queueMicrotask(() => void openHistory(member));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    return (
        <MuiThemeProvider>
            <DashboardBackground />
            <Head title={t('Attendance')} />

            <Dialog
                {...popup.dialogProps}
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
                        icon={<AssignmentTurnedInIcon fontSize="small" />}
                        title={t('Attendance')}
                        subtitle={`${activeFilter === 'all' ? t('All groups') : groupNameOf(groups, activeFilter)} · ${tc(':count member|:count members', filteredMembers.length)}`}
                        onClose={popup.close}
                    />
                    {groups.length > 0 && (
                        <div className="px-[18px] pt-4 pb-3">
                            <FormControl fullWidth size="small">
                                <InputLabel
                                    id="attendance-group-label"
                                    sx={{ color: popupFg(0.5) }}
                                >
                                    {t('Group')}
                                </InputLabel>
                                <Select
                                    labelId="attendance-group-label"
                                    label={t('Group')}
                                    value={activeFilter}
                                    onChange={(e) =>
                                        setGroupFilter(
                                            e.target.value === 'all'
                                                ? 'all'
                                                : Number(e.target.value),
                                        )
                                    }
                                    sx={{
                                        color: POPUP_FG,
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: popupFg(0.3),
                                        },
                                        '& .MuiSvgIcon-root': {
                                            color: POPUP_FG,
                                        },
                                    }}
                                >
                                    {showAll && (
                                        <MenuItem value="all">
                                            {t('All (:count)', {
                                                count: members.length,
                                            })}
                                        </MenuItem>
                                    )}
                                    {groups.map((group) => (
                                        <MenuItem
                                            key={group.id}
                                            value={group.id}
                                        >
                                            {group.name} (
                                            {counts[group.id] ?? 0})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                    )}
                    <PillSearchField
                        value={attendanceSearch}
                        onChange={setAttendanceSearch}
                        placeholder={t('Search member...')}
                    />
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    {filteredMembers.length === 0 ? (
                        <EmptyState
                            icon={<AssignmentTurnedInIcon />}
                            title={t('No members found.')}
                        />
                    ) : (
                        <ul className="border-t border-[var(--popup-border)]">
                            {filteredMembers.map((member, index) => (
                                <li
                                    key={member.id}
                                    className="border-b border-[var(--popup-border)]"
                                >
                                    <button
                                        type="button"
                                        onClick={() => void openHistory(member)}
                                        className="flex w-full cursor-pointer items-center gap-3 px-[18px] py-2.5 text-left transition hover:bg-[var(--popup-ghost)]"
                                    >
                                        <Avatar sx={avatarSx(index)}>
                                            {getInitials(member.name)}
                                        </Avatar>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[15px] font-bold text-[var(--popup-fg)]">
                                                {member.name}
                                            </span>
                                            <span className="block text-[13px] text-[var(--popup-muted)]">
                                                {activeFilter === 'all' &&
                                                    `${groupNameOf(groups, member.group_id)} · `}
                                                {t('Attendances: :count', {
                                                    count: member.current_month_attendances_count,
                                                })}
                                            </span>
                                        </span>
                                        <ChevronRightIcon
                                            fontSize="small"
                                            className="flex-none text-[var(--popup-muted)]"
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={showMemberHistoryModal}
                onClose={closeHistory}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <PopupHeader
                    icon={<CalendarMonthIcon fontSize="small" />}
                    title={t('Attendance')}
                    subtitle={
                        selectedMember
                            ? `${selectedMember.name} · ${groupNameOf(groups, selectedMember.group_id)}`
                            : ''
                    }
                    onClose={closeHistory}
                />

                <DialogContent sx={{ p: 0 }}>
                    {history === null ? (
                        <div className="px-[18px] pb-4">
                            <CardsSkeleton />
                        </div>
                    ) : memberAttendanceRows.length === 0 ? (
                        <EmptyState
                            icon={<CalendarMonthIcon />}
                            title={t('No attendance history yet.')}
                        />
                    ) : (
                        <>
                            <SummaryCard
                                tone="green"
                                title={t(':month: :count trainings', {
                                    month: dayjs().format('MMMM YYYY'),
                                    count: currentMonthData?.total ?? 0,
                                })}
                            >
                                {t(':year: :count trainings in :months', {
                                    year: currentYear,
                                    count: yearGroups[currentYear]?.total ?? 0,
                                    months: tc(
                                        ':count month|:count months',
                                        yearGroups[currentYear]?.monthCount ??
                                            0,
                                    ),
                                })}
                            </SummaryCard>
                            <ul className="border-t border-[var(--popup-border)]">
                                {allYears.map((year, index) => (
                                    <YearSection
                                        key={year}
                                        year={year}
                                        summary={tc(
                                            ':count training|:count trainings',
                                            yearGroups[year].total,
                                        )}
                                        defaultOpen={index === 0}
                                    >
                                        {sortedMonths
                                            .filter(
                                                (month) =>
                                                    dayjs(month).format(
                                                        'YYYY',
                                                    ) === year,
                                            )
                                            .map((month) => (
                                                <DrillRow
                                                    key={month}
                                                    title={dayjs(month).format(
                                                        'MMMM YYYY',
                                                    )}
                                                    subtitle={t('Last: :date', {
                                                        date: dayjs(
                                                            lastDateOf(month),
                                                        ).format('DD.MM.YYYY'),
                                                    })}
                                                    value={
                                                        groupedByMonth[month]
                                                            .total
                                                    }
                                                    valueClassName="text-green-600 dark:text-green-400"
                                                    onClick={() => {
                                                        setSelectedMonth(month);
                                                        setShowMonthDatesModal(
                                                            true,
                                                        );
                                                    }}
                                                />
                                            ))}
                                    </YearSection>
                                ))}
                            </ul>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={showMonthDatesModal}
                onClose={closeMonth}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: POPUP_BG } }}
            >
                <PopupHeader
                    icon={<CalendarMonthIcon fontSize="small" />}
                    title={
                        selectedMonth
                            ? dayjs(selectedMonth).format('MMMM YYYY')
                            : ''
                    }
                    subtitle={
                        selectedMember
                            ? `${selectedMember.name} · ${tc(':count training|:count trainings', selectedMonthAttendances.length)}`
                            : ''
                    }
                    onClose={closeMonth}
                />

                <DialogContent sx={{ p: 0 }}>
                    {selectedMonthAttendances.length > 0 ? (
                        <ul className="border-t border-[var(--popup-border)]">
                            {selectedMonthAttendances.map((attendance) => (
                                <li
                                    key={attendance.id}
                                    className="border-b border-[var(--popup-border)] px-[18px] py-3 last:border-b-0"
                                >
                                    <span className="block text-[15px] font-semibold text-[var(--popup-fg)] capitalize">
                                        {dayjs(attendance.date).format(
                                            'dddd, DD.MM.YYYY',
                                        )}
                                    </span>
                                    <span className="block text-[13px] text-[var(--popup-muted)]">
                                        {groupWithSubgroupName(
                                            groups,
                                            attendance.group_id,
                                            attendance.subgroup_id,
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            icon={<CalendarMonthIcon />}
                            title={t(
                                'No attendance dates recorded for this month.',
                            )}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
}
