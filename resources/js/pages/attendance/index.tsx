import { Head, router } from '@inertiajs/react';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { apiRequest } from '@/lib/api';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

interface Member {
    id: number;
    name: string;
    pool: 'big' | 'small';
    current_month_attendances_count: number;
}

interface AttendanceRow {
    id: number;
    member_id: number;
    member_name: string;
    pool: 'big' | 'small';
    date: string;
}

interface Props {
    members?: Member[];
    attendanceRows?: AttendanceRow[];
}

interface ListAttendanceResponse {
    members: Member[];
    attendanceRows: AttendanceRow[];
}

const darkTheme = createTheme({
    palette: { mode: 'dark' },
});

const DARK_BG = '#1d232a';

const chipSx = {
    minWidth: '180px',
    display: 'flex',
    justifyContent: 'center',
};

export default function AttendanceIndex({
    members: initialMembers = [],
    attendanceRows: initialAttendanceRows = [],
}: Props) {
    const [members, setMembers] = useState(initialMembers);
    const [attendanceRows, setAttendanceRows] = useState(initialAttendanceRows);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [showMemberHistoryModal, setShowMemberHistoryModal] = useState(false);
    const [showYearDetailModal, setShowYearDetailModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [showCurrentYearMonthsModal, setShowCurrentYearMonthsModal] =
        useState(false);
    const [showMonthDatesModal, setShowMonthDatesModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [attendanceSearch, setAttendanceSearch] = useState('');
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [attendanceError, setAttendanceError] = useState<string | null>(null);

    const currentPool = activeTab === 0 ? 'big' : 'small';

    useEffect(() => {
        const loadAttendance = async () => {
            setLoadingAttendance(true);
            setAttendanceError(null);

            try {
                const data =
                    await apiRequest<ListAttendanceResponse>('/api/attendance');

                setMembers(data.members);
                setAttendanceRows(data.attendanceRows);
            } catch {
                setAttendanceError('Unable to refresh attendance data.');
            } finally {
                setLoadingAttendance(false);
            }
        };

        void loadAttendance();
    }, []);

    const filteredMembers = members.filter(
        (member) =>
            member.pool === currentPool &&
            member.name.toLowerCase().includes(attendanceSearch.toLowerCase()),
    );

    const memberAttendanceRows = useMemo(() => {
        if (!selectedMember) {
            return [];
        }

        return attendanceRows
            .filter((row) => row.member_id === selectedMember.id)
            .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
    }, [attendanceRows, selectedMember]);

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
        .filter((year) => year !== currentYear)
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
        <ThemeProvider theme={darkTheme}>
            <Head title="Attendance" />

            <Dialog
                open={true}
                onClose={() => router.visit('/dashboard')}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: DARK_BG,
                        height: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <TextField
                            variant="standard"
                            placeholder="Search member..."
                            value={attendanceSearch}
                            onChange={(e) =>
                                setAttendanceSearch(e.target.value)
                            }
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                width: 180,
                                '& input': { color: 'white' },
                                '& .MuiInput-underline::before': {
                                    borderBottomColor: 'rgba(255,255,255,0.3)',
                                },
                                '& .MuiInput-underline:hover::before': {
                                    borderBottomColor: 'white',
                                },
                                '& .MuiInput-underline::after': {
                                    borderBottomColor: 'white',
                                },
                            }}
                        />

                        <IconButton
                            onClick={() => router.visit('/dashboard')}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <Divider />
                    <Tabs
                        value={activeTab}
                        onChange={(_, val) => setActiveTab(val)}
                        centered
                    >
                        <Tab label="Big Pool" />
                        <Tab label="Small Pool" />
                    </Tabs>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
                    {attendanceError && (
                        <Typography
                            variant="body2"
                            color="error"
                            sx={{ textAlign: 'center', mt: 2 }}
                        >
                            {attendanceError}
                        </Typography>
                    )}

                    {loadingAttendance ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 6 }}
                        >
                            Loading attendance...
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {filteredMembers.map((member) => (
                                <ListItemButton
                                    key={member.id}
                                    divider
                                    onClick={() => {
                                        setSelectedMember(member);
                                        setShowMemberHistoryModal(true);
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar>
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
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
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
                    )}
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
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Attendance - {selectedMember?.name}
                        </Typography>
                        <IconButton
                            onClick={() => {
                                setShowMemberHistoryModal(false);
                                setSelectedMember(null);
                            }}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
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
                                                bgcolor:
                                                    'rgba(255,255,255,0.05)',
                                            },
                                        }}
                                        onClick={() =>
                                            setShowCurrentYearMonthsModal(true)
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
                                                {dayjs(currentMonthKey).format(
                                                    'MMMM YYYY',
                                                )}
                                            </Typography>
                                            {currentYearMonths.length > 1 && (
                                                <Typography
                                                    variant="caption"
                                                    color="primary"
                                                >
                                                    {currentYearMonths.length}{' '}
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
                                                    bgcolor:
                                                        'rgba(255,255,255,0.05)',
                                                },
                                            }}
                                            onClick={() => {
                                                setSelectedYear(year);
                                                setShowYearDetailModal(true);
                                            }}
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
                </DialogContent>
            </Dialog>

            <Dialog
                open={showCurrentYearMonthsModal}
                onClose={() => setShowCurrentYearMonthsModal(false)}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Attendance By Month - {currentYear}
                        </Typography>
                        <IconButton
                            onClick={() => setShowCurrentYearMonthsModal(false)}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
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
                                            bgcolor: 'rgba(255,255,255,0.05)',
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
                    sx: { bgcolor: DARK_BG },
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
                        <IconButton
                            onClick={() => {
                                setShowMonthDatesModal(false);
                                setSelectedMonth(null);
                            }}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
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
                    sx: { bgcolor: DARK_BG },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <Typography variant="h6" fontWeight="bold">
                            Attendance By Month - {selectedYear}
                        </Typography>
                        <IconButton
                            onClick={() => {
                                setShowYearDetailModal(false);
                                setSelectedYear(null);
                            }}
                            color="error"
                        >
                            <CloseIcon />
                        </IconButton>
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
                                            bgcolor: 'rgba(255,255,255,0.05)',
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
        </ThemeProvider>
    );
}
