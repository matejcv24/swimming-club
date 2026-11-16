import { Head } from '@inertiajs/react';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';
import { DashboardBackground } from '@/components/dashboard-background';
import {
    MuiThemeProvider,
    POPUP_BG,
    POPUP_FG,
    popupFg,
} from '@/components/mui-theme-provider';
import {
    CloseButton,
    PillSearchField,
    PopupHeader,
} from '@/components/popup-ui';
import { CardsSkeleton } from '@/components/skeletons';
import { usePagePopup } from '@/hooks/use-page-popup';
import { groupNameOf, useGroups } from '@/lib/groups';

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
}

interface Props {
    userRole: 'admin' | 'coach';
    members: Member[];
}

const chipSx = {
    minWidth: '180px',
    display: 'flex',
    justifyContent: 'center',
};

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
    const [showYearDetailModal, setShowYearDetailModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [showCurrentYearMonthsModal, setShowCurrentYearMonthsModal] =
        useState(false);
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
            (activeFilter === 'all' || member.group_id === activeFilter) &&
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
    const currentYearMonths = sortedMonths.filter(
        (month) => dayjs(month).format('YYYY') === currentYear,
    );
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

    const sortedYears = Object.keys(yearGroups)
        .filter((year) => year !== currentYear || !currentMonthData)
        .sort()
        .reverse();

    const yearMonths = selectedYear
        ? sortedMonths.filter(
              (month) => dayjs(month).format('YYYY') === selectedYear,
          )
        : [];

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
            <Head title="Attendance" />

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
                        title="Attendance"
                        subtitle={`${activeFilter === 'all' ? 'All groups' : groupNameOf(groups, activeFilter)} · ${filteredMembers.length} ${filteredMembers.length === 1 ? 'member' : 'members'}`}
                        onClose={popup.close}
                    />
                    <PillSearchField
                        value={attendanceSearch}
                        onChange={setAttendanceSearch}
                        placeholder="Search member..."
                    />
                    {groups.length > 0 && (
                        <div className="px-[18px] pt-4 pb-3">
                            <FormControl fullWidth size="small">
                                <InputLabel
                                    id="attendance-group-label"
                                    sx={{ color: popupFg(0.5) }}
                                >
                                    Group
                                </InputLabel>
                                <Select
                                    labelId="attendance-group-label"
                                    label="Group"
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
                                            All ({members.length})
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
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    <List disablePadding>
                        {filteredMembers.map((member) => (
                            <ListItemButton
                                key={member.id}
                                divider
                                onClick={() => void openHistory(member)}
                            >
                                <ListItemAvatar>
                                    <Avatar>{getInitials(member.name)}</Avatar>
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
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {activeFilter === 'all' &&
                                                `${groupNameOf(groups, member.group_id)} · `}
                                            Attendances:{' '}
                                            {
                                                member.current_month_attendances_count
                                            }
                                        </Typography>
                                    }
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showMemberHistoryModal}
                onClose={() => {
                    setShowMemberHistoryModal(false);
                    setSelectedMember(null);
                }}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: POPUP_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Attendance - {selectedMember?.name}
                        </Typography>
                        <CloseButton
                            onClick={() => {
                                setShowMemberHistoryModal(false);
                                setSelectedMember(null);
                            }}
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {history === null ? (
                        <div className="p-4">
                            <CardsSkeleton />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 p-4">
                            <div className="flex flex-col gap-4">
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        textTransform: 'uppercase',
                                        letterSpacing: 1,
                                    }}
                                >
                                    Attendances By Month
                                </Typography>

                                {currentMonthData ? (
                                    <List disablePadding>
                                        <ListItem
                                            divider
                                            sx={{
                                                px: 0,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 2,
                                                alignItems: 'center',
                                                py: 1.5,
                                                '&:hover': {
                                                    bgcolor: popupFg(0.05),
                                                },
                                            }}
                                            onClick={() =>
                                                setShowCurrentYearMonthsModal(
                                                    true,
                                                )
                                            }
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                }}
                                            >
                                                <Typography variant="body2">
                                                    {dayjs(
                                                        currentMonthKey,
                                                    ).format('MMMM YYYY')}
                                                </Typography>
                                                {currentYearMonths.length >
                                                    1 && (
                                                    <Typography
                                                        variant="caption"
                                                        color="primary"
                                                    >
                                                        {
                                                            currentYearMonths.length
                                                        }{' '}
                                                        months
                                                    </Typography>
                                                )}
                                            </div>

                                            <Chip
                                                label={`Attendances: ${currentMonthData.total}`}
                                                color="success"
                                                size="small"
                                                sx={chipSx}
                                            />
                                        </ListItem>
                                    </List>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        No attendances recorded this month.
                                    </Typography>
                                )}
                            </div>

                            <Divider />

                            <div className="flex flex-col gap-4">
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        textTransform: 'uppercase',
                                        letterSpacing: 1,
                                    }}
                                >
                                    Attendances By Year
                                </Typography>

                                {sortedYears.length > 0 ? (
                                    <List disablePadding>
                                        {sortedYears.map((year) => (
                                            <ListItem
                                                key={year}
                                                divider
                                                sx={{
                                                    px: 0,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 2,
                                                    alignItems: 'center',
                                                    py: 1.5,
                                                    '&:hover': {
                                                        bgcolor: popupFg(0.05),
                                                    },
                                                }}
                                                onClick={() => {
                                                    setSelectedYear(year);
                                                    setShowYearDetailModal(
                                                        true,
                                                    );
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'center',
                                                        alignItems: 'center',
                                                        gap: '16px',
                                                    }}
                                                >
                                                    <Typography variant="body2">
                                                        {year}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="primary"
                                                    >
                                                        {
                                                            yearGroups[year]
                                                                .monthCount
                                                        }{' '}
                                                        months
                                                    </Typography>
                                                </div>

                                                <Chip
                                                    label={`Attendances: ${yearGroups[year].total}`}
                                                    color="success"
                                                    size="small"
                                                    sx={chipSx}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        No attendance history yet.
                                    </Typography>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={showCurrentYearMonthsModal}
                onClose={() => setShowCurrentYearMonthsModal(false)}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: POPUP_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Attendance By Month - {currentYear}
                        </Typography>
                        <CloseButton
                            onClick={() => setShowCurrentYearMonthsModal(false)}
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    <List disablePadding>
                        {currentYearMonths.map((month) => {
                            const monthData = groupedByMonth[month];

                            return (
                                <ListItem
                                    key={month}
                                    divider
                                    sx={{
                                        px: 2,
                                        py: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: popupFg(0.05),
                                        },
                                    }}
                                    onClick={() => {
                                        setSelectedMonth(month);
                                        setShowMonthDatesModal(true);
                                    }}
                                >
                                    <Typography variant="body2">
                                        {dayjs(month).format('MMMM YYYY')}
                                    </Typography>

                                    <Chip
                                        label={`Attendances: ${monthData.total}`}
                                        color="success"
                                        size="small"
                                        sx={chipSx}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showMonthDatesModal}
                onClose={() => {
                    setShowMonthDatesModal(false);
                    setSelectedMonth(null);
                }}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: POPUP_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Attendance Dates -{' '}
                            {selectedMonth
                                ? dayjs(selectedMonth).format('MMMM YYYY')
                                : ''}
                        </Typography>
                        <CloseButton
                            onClick={() => {
                                setShowMonthDatesModal(false);
                                setSelectedMonth(null);
                            }}
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {selectedMonthAttendances.length > 0 ? (
                        <List disablePadding>
                            {selectedMonthAttendances.map((attendance) => (
                                <ListItem
                                    key={attendance.id}
                                    divider
                                    sx={{
                                        px: 2,
                                        py: 2,
                                    }}
                                >
                                    <Typography variant="body2">
                                        {dayjs(attendance.date).format(
                                            'DD.MM.YYYY - dddd',
                                        )}
                                    </Typography>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ p: 3, textAlign: 'center' }}
                        >
                            No attendance dates recorded for this month.
                        </Typography>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={showYearDetailModal}
                onClose={() => {
                    setShowYearDetailModal(false);
                    setSelectedYear(null);
                }}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: POPUP_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Attendance By Month - {selectedYear}
                        </Typography>
                        <CloseButton
                            onClick={() => {
                                setShowYearDetailModal(false);
                                setSelectedYear(null);
                            }}
                        />
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    <List disablePadding>
                        {yearMonths.map((month) => {
                            const monthData = groupedByMonth[month];

                            return (
                                <ListItem
                                    key={month}
                                    divider
                                    sx={{
                                        px: 2,
                                        py: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: popupFg(0.05),
                                        },
                                    }}
                                    onClick={() => {
                                        setSelectedMonth(month);
                                        setShowMonthDatesModal(true);
                                    }}
                                >
                                    <Typography variant="body2">
                                        {dayjs(month).format('MMMM YYYY')}
                                    </Typography>

                                    <Chip
                                        label={`Attendances: ${monthData.total}`}
                                        color="success"
                                        size="small"
                                        sx={chipSx}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>
        </MuiThemeProvider>
    );
}
