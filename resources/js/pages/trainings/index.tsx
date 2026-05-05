import { Head, router } from '@inertiajs/react';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ApiValidationError, apiRequest } from '@/lib/api';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useState } from 'react';

interface Member {
    id: number;
    name: string;
    pool: string;
}

interface Props {
    members?: Member[];
}

interface ListTrainingsResponse {
    members: Member[];
}

interface AttendanceByDateResponse {
    member_ids: number[];
}

interface StoreTrainingResponse {
    message: string;
    member_ids: number[];
}

const darkTheme = createTheme({
    palette: { mode: 'dark' },
});

const DARK_BG = '#1d232a';

export default function TrainingsIndex({
    members: initialMembers = [],
}: Props) {
    const [members, setMembers] = useState(initialMembers);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [checkedIds, setCheckedIds] = useState<number[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveErrors, setSaveErrors] = useState<Record<string, string[]>>({});
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [attendanceSearch, setAttendanceSearch] = useState('');

    const activePool = activeTab === 0 ? 'big' : 'small';
    const poolMembers = members.filter((m) => m.pool === activePool);

    useEffect(() => {
        const loadMembers = async () => {
            setLoadingMembers(true);
            setMembersError(null);

            try {
                const data =
                    await apiRequest<ListTrainingsResponse>('/api/trainings');

                setMembers(data.members);
            } catch {
                setMembersError('Unable to refresh training members.');
            } finally {
                setLoadingMembers(false);
            }
        };

        void loadMembers();
    }, []);

    const loadAttendance = useCallback(async (date: Dayjs, pool: string) => {
        setSelectedDate(date);
        setEditMode(false);
        setLoading(true);

        try {
            const data = await apiRequest<AttendanceByDateResponse>(
                `/api/trainings/by-date?date=${date.format('YYYY-MM-DD')}&pool=${pool}`,
            );
            setCheckedIds(data.member_ids ?? []);
        } catch {
            setCheckedIds([]);
        }

        setLoading(false);
        setShowAttendanceModal(true);
    }, []);

    const handleDateClick = async (date: Dayjs | null) => {
        if (!date) {
            return;
        }

        await loadAttendance(date, activePool);
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const date = params.get('date');
        const pool = params.get('pool');
        const shouldOpenAttendance = params.get('attendance') === '1';

        if (!date || !pool || !shouldOpenAttendance) {
            return;
        }

        if (pool !== 'big' && pool !== 'small') {
            return;
        }

        queueMicrotask(() => {
            setActiveTab(pool === 'big' ? 0 : 1);
            void loadAttendance(dayjs(date), pool);
        });
    }, [loadAttendance]);

    const toggleMember = (id: number) => {
        if (!editMode) {
            return;
        }

        setCheckedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const handleSave = async () => {
        if (!selectedDate) {
            return;
        }

        setSaveError(null);
        setSaveErrors({});
        setSavingAttendance(true);

        try {
            const data = await apiRequest<StoreTrainingResponse>(
                '/api/trainings',
                {
                    method: 'POST',
                    body: {
                        date: selectedDate.format('YYYY-MM-DD'),
                        pool: activePool,
                        member_ids: checkedIds,
                    },
                },
            );

            setCheckedIds(data.member_ids);
            setShowAttendanceModal(false);
            setAttendanceSearch('');
            setEditMode(false);
        } catch (error) {
            if (error instanceof ApiValidationError) {
                setSaveErrors(error.errors);
                setSaveError(error.message);

                return;
            }

            setSaveError('Unable to save attendance. Please try again.');
        } finally {
            setSavingAttendance(false);
        }
    };

    const dateError = saveErrors.date?.[0];
    const poolError = saveErrors.pool?.[0];
    const memberIdsError =
        saveErrors.member_ids?.[0] ?? saveErrors['member_ids.0']?.[0];

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    const isNewSession = checkedIds.length === 0 && !editMode;

    return (
        <ThemeProvider theme={darkTheme}>
            <Head title="Attendance" />

            {/* Main Attendance Modal */}
            <Dialog
                open={true}
                onClose={() => router.visit('/dashboard')}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: DARK_BG,
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                {/* Header */}
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <div className="relative flex items-center">
                            <Tabs
                                value={activeTab}
                                onChange={(_, val) => setActiveTab(val)}
                                centered
                                sx={{ flex: 1 }}
                            >
                                <Tab label="Big Pool" />
                                <Tab label="Small Pool" />
                            </Tabs>
                            <IconButton
                                onClick={() => router.visit('/dashboard')}
                                color="error"
                                sx={{ position: 'absolute', right: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </div>
                    </Box>
                </DialogTitle>

                {/* Date Calendar */}
                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    {membersError && (
                        <Typography
                            variant="body2"
                            color="error"
                            sx={{ textAlign: 'center', mt: 2 }}
                        >
                            {membersError}
                        </Typography>
                    )}

                    {loadingMembers && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 2 }}
                        >
                            Loading members...
                        </Typography>
                    )}

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateCalendar
                            onChange={(date: Dayjs | null) =>
                                handleDateClick(date)
                            }
                            sx={{ width: '100%' }}
                        />
                    </LocalizationProvider>
                </DialogContent>
            </Dialog>

            {/* Attendance List Modal */}
            <Dialog
                open={showAttendanceModal}
                onClose={() => setShowAttendanceModal(false)}
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: DARK_BG,
                        height: '70vh',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Search Bar */}
                        <TextField
                            variant="standard"
                            placeholder="Search swimmer..."
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
                                flex: 1,
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

                        {/* Edit and Close Buttons */}
                        <div className="ml-2 flex items-center gap-1">
                            <IconButton
                                onClick={() => setEditMode((prev) => !prev)}
                                color={editMode ? 'primary' : 'default'}
                                title="Edit attendance"
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => {
                                    setShowAttendanceModal(false);
                                    setAttendanceSearch('');
                                }}
                                color="error"
                            >
                                <CloseIcon />
                            </IconButton>
                        </div>
                    </div>
                    {editMode && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ px: 4, pb: 1, display: 'block' }}
                        >
                            Edit mode — check or uncheck members then save
                        </Typography>
                    )}
                    {saveError && (
                        <Typography
                            variant="body2"
                            color="error"
                            sx={{ px: 4, pb: 1, display: 'block' }}
                        >
                            {saveError}
                        </Typography>
                    )}
                    {(dateError || poolError || memberIdsError) && (
                        <Typography
                            variant="caption"
                            color="error"
                            sx={{ px: 4, pb: 1, display: 'block' }}
                        >
                            {dateError ?? poolError ?? memberIdsError}
                        </Typography>
                    )}
                    <Divider />
                </DialogTitle>

                <DialogContent sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 4 }}
                        >
                            Loading...
                        </Typography>
                    ) : poolMembers.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 4 }}
                        >
                            No members registered for this pool.
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {poolMembers
                                .filter(
                                    (m) =>
                                        (editMode
                                            ? true
                                            : checkedIds.includes(m.id)) &&
                                        m.name
                                            .toLowerCase()
                                            .includes(
                                                attendanceSearch.toLowerCase(),
                                            ),
                                )
                                .map((member) => (
                                    <ListItem
                                        key={member.id}
                                        divider
                                        secondaryAction={
                                            <Checkbox
                                                edge="end"
                                                checked={checkedIds.includes(
                                                    member.id,
                                                )}
                                                onChange={() =>
                                                    toggleMember(member.id)
                                                }
                                                disabled={!editMode}
                                            />
                                        }
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
                                        />
                                    </ListItem>
                                ))}
                        </List>
                    )}
                </DialogContent>

                {/* Footer - Fixed */}
                <div className="flex-shrink-0 p-4">
                    {editMode || isNewSession ? (
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={handleSave}
                            disabled={
                                checkedIds.length === 0 || savingAttendance
                            }
                        >
                            {savingAttendance
                                ? 'Saving...'
                                : `Save Attendance (${checkedIds.length} present)`}
                        </Button>
                    ) : (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center' }}
                        >
                            {checkedIds.length} member
                            {checkedIds.length !== 1 ? 's' : ''} attended —
                            click ✏️ to edit
                        </Typography>
                    )}
                </div>
            </Dialog>
        </ThemeProvider>
    );
}
